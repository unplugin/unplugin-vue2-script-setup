import { Parser as HTMLParser } from 'htmlparser2'
import { types as t } from '@babel/core'
import { parse, ParserOptions, ParserPlugin } from '@babel/parser'
import { camelize, capitalize, isHTMLTag, isSVGTag, isVoidTag } from '@vue/shared'
import traverse from '@babel/traverse'
import generate from '@babel/generator'

interface TagMeta {
  start: number
  end: number
  contentStart: number
  contentEnd: number
  content: string
  attrs: Record<string, string>
  found: boolean
}

export interface ParseResult {
  id?: string
  template: {
    components: Set<string>
    identifiers: Set<string>
  }
  scriptSetup: TagMeta
  script: TagMeta
}

export function parseVueSFC(code: string, id?: string): ParseResult {
  const components = new Set<string>()
  const expressions = new Set<string>()
  const identifiers = new Set<string>()

  let templateLevel = 0
  let inScriptSetup = false
  let inScript = false

  const scriptSetup: TagMeta = {
    start: 0,
    end: 0,
    contentStart: 0,
    contentEnd: 0,
    content: '',
    attrs: {},
    found: false,
  }
  const script: TagMeta = {
    start: 0,
    end: 0,
    contentStart: 0,
    contentEnd: 0,
    content: '',
    attrs: {},
    found: false,
  }

  const parser = new HTMLParser({
    onopentag(name, attributes) {
      if (name === 'template')
        templateLevel += 1

      if (templateLevel > 0) {
        if (!isHTMLTag(name) && !isSVGTag(name) && !isVoidTag(name))
          components.add(capitalize(camelize(name)))
        Object.entries(attributes).forEach(([key, value]) => {
          if (!value)
            return
          if (key.startsWith('v-') || key.startsWith('@') || key.startsWith(':'))
            expressions.add(value)
          if (key === 'ref')
            identifiers.add(value)
        })
      }
      else {
        if (name === 'script') {
          if ('setup' in attributes) {
            scriptSetup.start = parser.startIndex
            scriptSetup.contentStart = parser.endIndex! + 1
            scriptSetup.attrs = attributes
            scriptSetup.found = true
            inScriptSetup = true
          }
          else {
            script.start = parser.startIndex
            script.contentStart = parser.endIndex! + 1
            script.attrs = attributes
            script.found = true
            inScript = true
          }
        }
      }
    },
    ontext(text) {
      if (templateLevel > 0) {
        Array.from(text.matchAll(/\{\{(.*?)\}\}/g)).forEach(([, expression]) => {
          expressions.add(expression)
        })
      }
    },
    onclosetag(name) {
      if (name === 'template')
        templateLevel -= 1

      if (inScriptSetup && name === 'script') {
        scriptSetup.end = parser.endIndex! + 1
        scriptSetup.contentEnd = parser.startIndex
        scriptSetup.content = code.slice(scriptSetup.contentStart, scriptSetup.contentEnd)
        inScriptSetup = false
      }
      if (inScript && name === 'script') {
        script.end = parser.endIndex! + 1
        script.contentEnd = parser.startIndex
        script.content = code.slice(script.contentStart, script.contentEnd)
        inScript = false
      }
    },
  }, {
    xmlMode: true,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
    recognizeSelfClosing: true,
  })

  parser.write(code)
  parser.end()

  expressions.forEach(exp => getIdentifiersFromCode(exp, identifiers))

  return {
    id,
    template: {
      components,
      identifiers,
    },
    scriptSetup,
    script,
  }
}

export function getIdentifiersFromCode(code: string, identifiers = new Set<string>(), options: ParserOptions = {}) {
  const ast = parse(code, options) as any
  traverse(ast, {
    Identifier(path) {
      identifiers.add(path.node.name)
    },
  })
  return identifiers
}

export function transformScriptSetup(result: ParseResult) {
  if (result.script.found && result.scriptSetup.found && result.scriptSetup.attrs.lang !== result.script.attrs.lang)
    throw new SyntaxError('<script setup> language must be the same as <script>')

  const lang = result.scriptSetup.attrs.lang || result.script.attrs.lang
  const plugins: ParserPlugin[] = []
  if (lang === 'ts')
    plugins.push('typescript')
  else if (lang === 'jsx')
    plugins.push('jsx')
  else if (lang === 'tsx')
    plugins.push('typescript', 'jsx')
  else if (lang !== 'js')
    throw new SyntaxError(`Unsupported script language: ${lang}`)

  const identifiers = new Set<string>()
  const scriptSetupAst = parse(result.scriptSetup.content, {
    sourceType: 'module',
    plugins,
  })
  const scriptAst = parse(result.script.content || 'export default {}', {
    sourceType: 'module',
    plugins,
  })

  // get all identifiers in `<script setup>`
  traverse(scriptSetupAst as any, {
    Identifier(path) {
      identifiers.add(path.node.name)
    },
  })

  const returns = Array.from(identifiers).filter(i => result.template.identifiers.has(i))
  const components = Array.from(identifiers).filter(i =>
    result.template.components.has(i)
    || result.template.components.has(camelize(i))
    || result.template.components.has(capitalize(camelize(i))),
  )

  const imports = scriptSetupAst.program.body.filter(n => n.type === 'ImportDeclaration')
  const scriptSetupBody = scriptSetupAst.program.body.filter(n => n.type !== 'ImportDeclaration')
  // TODO: apply macros

  // append `<script setup>` imports to `<script>`
  scriptAst.program.body.unshift(...imports)

  // replace `export default` with a temproray variable
  // `const __sfc_main = { ... }`
  traverse(scriptAst as any, {
    ExportDefaultDeclaration(path) {
      const decl = path.node.declaration
      path.replaceWith(
        t.variableDeclaration('const', [
          t.variableDeclarator(
            t.identifier('__sfc_main'),
            decl as any,
          ),
        ]),
      )
    },
  })

  // inject setup function
  // `__sfc_main.setup = () => {}`
  if (scriptSetupBody.length) {
    const returnStatement = t.returnStatement(
      t.objectExpression(
        returns.map((i) => {
          const id = t.identifier(i)
          return t.objectProperty(id, id, false, true)
        }),
      ),
    )

    scriptAst.program.body.push(
      t.expressionStatement(
        t.assignmentExpression('=',
          t.memberExpression(t.identifier('__sfc_main'), t.identifier('setup')),
          t.arrowFunctionExpression([], t.blockStatement([
            ...scriptSetupBody,
            returnStatement as any,
          ])),
        ),
      ) as any,
    )
  }

  // inject components
  // `__sfc_main.components = Object.assign({ ... }, __sfc_main.components)`
  if (components.length) {
    const componentsObject = t.objectExpression(
      components.map((i) => {
        const id = t.identifier(i)
        return t.objectProperty(id, id, false, true)
      }),
    )

    scriptAst.program.body.push(
      t.expressionStatement(
        t.assignmentExpression('=',
          t.memberExpression(t.identifier('__sfc_main'), t.identifier('components')),
          t.callExpression(
            t.memberExpression(t.identifier('Object'), t.identifier('assign')),
            [
              componentsObject,
              t.memberExpression(
                t.identifier('__sfc_main'),
                t.identifier('components'),
              ),
            ],
          ),
        ),
      ) as any,
    )
  }

  // re-export
  // `export default __sfc_main`
  scriptAst.program.body.push(
    t.exportDefaultDeclaration(t.identifier('__sfc_main')) as any,
  )

  return {
    ast: scriptAst,
    code: generate(scriptAst as any).code,
  }
}

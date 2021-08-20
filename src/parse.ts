import { Parser as HTMLParser } from 'htmlparser2'
import { types } from '@babel/core'
import { parse, ParserOptions, ParserPlugin } from '@babel/parser'
import { isHTMLTag, isSVGTag, isVoidTag } from '@vue/shared'
import traverse from '@babel/traverse'
import generate from '@babel/generator'

interface TagMeta {
  start: number
  end: number
  contentStart: number
  contentEnd: number
  content: string
  attributes: Record<string, string>
}

export interface ParseResult {
  template: {
    components: Set<string>
    identifiers: Set<string>
  }
  scriptSetup: TagMeta
  script: TagMeta
}

export function parseVueSFC(code: string): ParseResult {
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
    attributes: {},
  }
  const script: TagMeta = {
    start: 0,
    end: 0,
    contentStart: 0,
    contentEnd: 0,
    content: '',
    attributes: {},
  }

  const parser = new HTMLParser({
    onopentag(name, attributes) {
      if (name === 'template')
        templateLevel += 1

      if (templateLevel > 0) {
        if (!isHTMLTag(name) && !isSVGTag(name) && !isVoidTag(name))
          components.add(name)
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
            scriptSetup.attributes = attributes
            inScriptSetup = true
          }
          else {
            script.start = parser.startIndex
            script.contentStart = parser.endIndex! + 1
            script.attributes = attributes
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
  if (result.scriptSetup.attributes.lang !== result.script.attributes.lang)
    throw new SyntaxError('<script setup> language must be the same as <script>')

  const plugins: ParserPlugin[] = []
  if (result.scriptSetup.attributes.lang === 'ts')
    plugins.push('typescript')
  if (result.scriptSetup.attributes.lang === 'jsx')
    plugins.push('jsx')
  if (result.scriptSetup.attributes.lang === 'tsx')
    plugins.push('typescript', 'jsx')

  const identifiers = new Set<string>()
  const scriptSetupAst = parse(result.scriptSetup.content, {
    sourceType: 'module',
    plugins,
  })
  const scriptAst = parse(result.script.content || 'export default {}', {
    sourceType: 'module',
    plugins,
  })

  traverse(scriptSetupAst as any, {
    Identifier(path) {
      identifiers.add(path.node.name)
    },
  })

  const returns = Array.from(identifiers).filter(i => result.template.identifiers.has(i))

  const imports = scriptSetupAst.program.body.filter(n => n.type === 'ImportDeclaration')
  const body = scriptSetupAst.program.body.filter(n => n.type !== 'ImportDeclaration')
  // TODO: apply macros
  const returnStatement = types.returnStatement(
    types.objectExpression(
      returns.map((i) => {
        const id = types.identifier(i)
        return types.objectProperty(id, id, false, true)
      }),
    ),
  )
  const setup = types.arrowFunctionExpression([], types.blockStatement([
    ...body,
    returnStatement as any,
  ]))

  scriptAst.program.body.unshift(...imports)

  // replace `export default` with a temproray variable
  traverse(scriptAst as any, {
    ExportDefaultDeclaration(path) {
      const decl = path.node.declaration
      path.replaceWith(
        types.variableDeclaration('const', [
          types.variableDeclarator(
            types.identifier('__sfc_main'),
            decl as any,
          ),
        ]),
      )
    },
  })

  // inject setup function
  scriptAst.program.body.push(
    types.expressionStatement(
      types.assignmentExpression('=', types.memberExpression(types.identifier('__sfc_main'), types.identifier('setup')), setup),
    ) as any,
  )

  // re-export
  scriptAst.program.body.push(
    types.exportDefaultDeclaration(types.identifier('__sfc_main')) as any,
  )

  return {
    ast: scriptAst,
    code: generate(scriptAst as any).code,
  }
}

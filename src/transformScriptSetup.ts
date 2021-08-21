import { types as t } from '@babel/core'
import { parse, ParserPlugin } from '@babel/parser'
import { camelize, capitalize } from '@vue/shared'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import { ParseResult } from './types'
import { applyMacros } from './macros'

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

  const imports = scriptSetupAst.program.body.filter(n => n.type === 'ImportDeclaration')
  const nodes = scriptSetupAst.program.body.filter(n => n.type !== 'ImportDeclaration')

  const { nodes: scriptSetupBody, props } = applyMacros(nodes)

  // get all identifiers in `<script setup>`
  scriptSetupAst.program.body = [...imports, ...nodes]
  traverse(scriptSetupAst as any, {
    Identifier(path) {
      identifiers.add(path.node.name)
    },
  })

  const returns = Array.from(identifiers).filter(i => result.template.identifiers.has(i))
  const components = Array.from(identifiers).filter(i => result.template.components.has(i)
    || result.template.components.has(camelize(i))
    || result.template.components.has(capitalize(camelize(i))),
  )

  // TODO: apply macros
  // append `<script setup>` imports to `<script>`
  scriptAst.program.body.unshift(...imports)

  const __sfc = t.identifier('__sfc_main')

  // replace `export default` with a temproray variable
  // `const __sfc_main = { ... }`
  traverse(scriptAst as any, {
    ExportDefaultDeclaration(path) {
      const decl = path.node.declaration
      path.replaceWith(
        t.variableDeclaration('const', [
          t.variableDeclarator(
            __sfc,
            decl as any,
          ),
        ]),
      )
    },
  })

  // inject props function
  // `__sfc_main.props = { ... }`
  if (props) {
    scriptAst.program.body.push(
      t.expressionStatement(
        t.assignmentExpression('=',
          t.memberExpression(__sfc, t.identifier('props')),
          props as any,
        ),
      ) as any,
    )
  }

  // inject setup function
  // `__sfc_main.setup = () => {}`
  if (nodes.length) {
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
          t.memberExpression(__sfc, t.identifier('setup')),
          t.arrowFunctionExpression([
            t.identifier('__props'),
            t.identifier('__ctx'),
          ], t.blockStatement([
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
          t.memberExpression(__sfc, t.identifier('components')),
          t.callExpression(
            t.memberExpression(t.identifier('Object'), t.identifier('assign')),
            [
              componentsObject,
              t.memberExpression(__sfc, t.identifier('components')),
            ],
          ),
        ),
      ) as any,
    )
  }

  // re-export
  // `export default __sfc_main`
  scriptAst.program.body.push(
    t.exportDefaultDeclaration(__sfc) as any,
  )

  return {
    ast: scriptAst,
    code: generate(scriptAst as any).code,
  }
}

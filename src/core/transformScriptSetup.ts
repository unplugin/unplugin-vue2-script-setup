import { types as t } from '@babel/core'
import { camelize, capitalize } from '@vue/shared'
import { Node, Statement } from '@babel/types'
import generate from '@babel/generator'
import { partition } from '@antfu/utils'
import { ParsedSFC, ScriptSetupTransformOptions } from '../types'
import { applyMacros } from './macros'
import { getIdentifierDeclarations } from './identifiers'

function isAsyncImport(node: any) {
  if (node.type === 'VariableDeclaration') {
    const declaration = node.declarations[0]

    return declaration.init.callee != null
      && declaration.init.callee.name === 'defineAsyncComponent'
  }

  return false
}

export function transformScriptSetup(sfc: ParsedSFC, options?: ScriptSetupTransformOptions) {
  const { scriptSetup, script, template } = sfc

  const { nodes: body, props, expose } = applyMacros(scriptSetup.ast.body)

  const [hoisted, setupBody] = partition(
    body,
    n =>
      isAsyncImport(n)
     || n.type === 'ImportDeclaration'
     || n.type === 'ExportNamedDeclaration'
     || n.type.startsWith('TS'),
  )

  // get all identifiers in `<script setup>`
  const declarations = new Set<string>()
  getIdentifierDeclarations(hoisted, declarations)
  getIdentifierDeclarations(setupBody, declarations)

  // filter out identifiers that are used in `<template>`
  const returns: t.ObjectExpression['properties'] = Array.from(declarations)
    .filter(Boolean)
    .filter(i => template.identifiers.has(i))
    .map((i) => {
      const id = t.identifier(i)
      return t.objectProperty(id, id, false, true)
    })

  const components = Array.from(declarations)
    .filter(Boolean)
    .filter(i => template.components.has(i)
      || template.components.has(camelize(i))
      || template.components.has(capitalize(camelize(i))),
    )

  // append `<script setup>` imports to `<script>`

  const __sfc = t.identifier('__sfc_main')

  let hasBody = false

  const bodyNodes = script.ast.body.map((node: Node) => {
    // replace `export default` with a temproray variable
    // `const __sfc_main = { ... }`
    if (node.type === 'ExportDefaultDeclaration') {
      hasBody = true
      return t.variableDeclaration('const', [
        t.variableDeclarator(
          __sfc,
          node.declaration as any,
        ),
      ])
    }
    return node
  })

  let ast = t.program([
    ...sfc.extraDeclarations,
    ...hoisted,
    ...bodyNodes,
  ] as Statement[])

  // inject `const __sfc_main = {}` if `<script>` has default export
  if (!hasBody) {
    ast.body.push(
      t.variableDeclaration('const', [
        t.variableDeclarator(
          __sfc,
          t.objectExpression([]),
        ),
      ]),
    )
  }

  // inject props function
  // `__sfc_main.props = { ... }`
  if (props) {
    hasBody = true
    ast.body.push(
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
  if (body.length) {
    hasBody = true
    const returnExpr = expose
      ? t.callExpression(
        t.memberExpression(t.identifier('Object'), t.identifier('assign')),
        [t.objectExpression(returns), expose],
      )
      : t.objectExpression(returns)
    const returnStatement = t.returnStatement(returnExpr)

    ast.body.push(
      t.expressionStatement(
        t.assignmentExpression('=',
          t.memberExpression(__sfc, t.identifier('setup')),
          t.arrowFunctionExpression([
            t.identifier('__props'),
            t.identifier('__ctx'),
          ], t.blockStatement([
            ...setupBody,
            returnStatement as any,
          ])),
        ),
      ) as any,
    )
  }

  // inject components
  // `__sfc_main.components = Object.assign({ ... }, __sfc_main.components)`
  if (components.length) {
    hasBody = true
    const componentsObject = t.objectExpression(
      components.map((i) => {
        const id = t.identifier(i)
        return t.objectProperty(id, id, false, true)
      }),
    )

    ast.body.push(
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

  if (!hasBody && !options?.astTransforms) {
    return {
      ast: null,
      code: '',
    }
  }

  // re-export
  // `export default __sfc_main`
  ast.body.push(
    t.exportDefaultDeclaration(__sfc) as any,
  )

  ast = options?.astTransforms?.post?.(ast, sfc) || ast

  return {
    ast,
    code: generate(ast).code,
  }
}

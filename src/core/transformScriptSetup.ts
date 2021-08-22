import { types as t } from '@babel/core'
import { camelize, capitalize } from '@vue/shared'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import { ParsedSFC, ScriptSetupTransformOptions } from '../types'
import { applyMacros } from './macros'
import { getIdentifierDeclarations } from './identifiers'

export function transformScriptSetup(sfc: ParsedSFC, options?: ScriptSetupTransformOptions) {
  const { scriptSetup, script, template } = sfc

  const imports = scriptSetup.ast.body.filter(n => n.type === 'ImportDeclaration')
  const body = scriptSetup.ast.body.filter(n => n.type !== 'ImportDeclaration')

  const { nodes: scriptSetupBody, props } = applyMacros(body)

  // get all identifiers in `<script setup>`
  const declarations = new Set<string>()
  getIdentifierDeclarations(imports, declarations)
  getIdentifierDeclarations(body, declarations)

  // filter out identifiers that are used in `<template>`
  const returns = Array.from(declarations)
    .filter(Boolean)
    .filter(i => template.identifiers.has(i))
  const components = Array.from(declarations)
    .filter(Boolean)
    .filter(i => template.components.has(i)
      || template.components.has(camelize(i))
      || template.components.has(capitalize(camelize(i))),
    )

  // append `<script setup>` imports to `<script>`
  let ast = t.program([
    ...imports,
    ...script.ast.body,
  ])

  const __sfc = t.identifier('__sfc_main')

  let hasBody = false

  // replace `export default` with a temproray variable
  // `const __sfc_main = { ... }`
  traverse(ast, {
    ExportDefaultDeclaration(path) {
      hasBody = true
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
    const returnStatement = t.returnStatement(
      t.objectExpression(
        returns.map((i) => {
          const id = t.identifier(i)
          return t.objectProperty(id, id, false, true)
        }),
      ),
    )

    ast.body.push(
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

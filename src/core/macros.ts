// modified from https://github.com/vuejs/vue-next/blob/main/packages/compiler-sfc/src/compileScript.ts

import {
  Node,
  ObjectExpression,
  TSType,
  TSTypeLiteral,
  TSFunctionType,
  ObjectProperty,
  Statement,
  CallExpression,
  TSInterfaceBody,
} from '@babel/types'
import { types as t } from '@babel/core'
import { parseExpression } from '@babel/parser'

// Special compiler macros
const DEFINE_PROPS = 'defineProps'
const DEFINE_EMITS = 'defineEmits'
const DEFINE_EXPOSE = 'defineExpose'
const WITH_DEFAULTS = 'withDefaults'

export interface PropTypeData {
  key: string
  type: string[] | string
  required: boolean
}

export function applyMacros(nodes: Statement[]) {
  let hasDefinePropsCall = false
  let hasDefineEmitCall = false
  let propsRuntimeDecl: Node | undefined
  let propsRuntimeDefaults: Node | undefined
  let propsTypeDecl: TSTypeLiteral | TSInterfaceBody | undefined
  let propsTypeDeclRaw: Node | undefined
  let emitsRuntimeDecl: Node | undefined
  let emitsTypeDecl:
  | TSFunctionType
  | TSTypeLiteral
  | TSInterfaceBody
  | undefined
  let emitsTypeDeclRaw: Node | undefined
  let exposeDecl: CallExpression['arguments'][number] | undefined

  // props/emits declared via types
  const typeDeclaredProps: Record<string, PropTypeData> = {}
  // record declared types for runtime props type generation
  const declaredTypes: Record<string, string[]> = {}

  function error(
    msg: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    node: Node,
  ): never {
    throw new Error(msg)
  }

  function processDefineProps(node: Node): boolean {
    if (!isCallOf(node, DEFINE_PROPS))
      return false

    if (hasDefinePropsCall)
      error(`duplicate ${DEFINE_PROPS}() call`, node)

    hasDefinePropsCall = true

    propsRuntimeDecl = node.arguments[0]

    // call has type parameters - infer runtime types from it
    if (node.typeParameters) {
      if (propsRuntimeDecl) {
        error(
          `${DEFINE_PROPS}() cannot accept both type and non-type arguments `
            + 'at the same time. Use one or the other.',
          node,
        )
      }

      propsTypeDeclRaw = node.typeParameters.params[0]
      propsTypeDecl = resolveQualifiedType(
        propsTypeDeclRaw,
        node => node.type === 'TSTypeLiteral',
      ) as TSTypeLiteral | TSInterfaceBody | undefined

      if (!propsTypeDecl) {
        error(
          `type argument passed to ${DEFINE_PROPS}() must be a literal type, `
            + 'or a reference to an interface or literal type.',
          propsTypeDeclRaw,
        )
      }
    }

    return true
  }

  function processWithDefaults(node: Node): boolean {
    if (!isCallOf(node, WITH_DEFAULTS))
      return false

    if (processDefineProps(node.arguments[0])) {
      if (propsRuntimeDecl) {
        error(
          `${WITH_DEFAULTS} can only be used with type-based `
            + `${DEFINE_PROPS} declaration.`,
          node,
        )
      }
      propsRuntimeDefaults = node.arguments[1]
    }
    else {
      error(
        `${WITH_DEFAULTS}' first argument must be a ${DEFINE_PROPS} call.`,
        node.arguments[0] || node,
      )
    }
    return true
  }

  function processDefineEmits(node: Node): boolean {
    if (!isCallOf(node, DEFINE_EMITS))
      return false

    if (hasDefineEmitCall)
      error(`duplicate ${DEFINE_EMITS}() call`, node)

    hasDefineEmitCall = true
    emitsRuntimeDecl = node.arguments[0]
    if (node.typeParameters) {
      if (emitsRuntimeDecl) {
        error(
          `${DEFINE_EMITS}() cannot accept both type and non-type arguments `
            + 'at the same time. Use one or the other.',
          node,
        )
      }

      emitsTypeDeclRaw = node.typeParameters.params[0]
      emitsTypeDecl = resolveQualifiedType(
        emitsTypeDeclRaw,
        node => node.type === 'TSFunctionType' || node.type === 'TSTypeLiteral',
      ) as TSFunctionType | TSTypeLiteral | TSInterfaceBody | undefined

      if (!emitsTypeDecl) {
        error(
          `type argument passed to ${DEFINE_EMITS}() must be a function type, `
            + 'a literal type with call signatures, or a reference to the above types.',
          emitsTypeDeclRaw,
        )
      }
    }
    return true
  }

  function resolveQualifiedType(
    node: Node,
    qualifier: (node: Node) => boolean,
  ) {
    if (qualifier(node))
      return node

    if (
      node.type === 'TSTypeReference'
      && node.typeName.type === 'Identifier'
    ) {
      const refName = node.typeName.name
      const isQualifiedType = (node: Node): Node | undefined => {
        if (
          node.type === 'TSInterfaceDeclaration'
          && node.id.name === refName
        )
          return node.body

        else if (
          node.type === 'TSTypeAliasDeclaration'
          && node.id.name === refName
          && qualifier(node.typeAnnotation)
        )
          return node.typeAnnotation

        else if (node.type === 'ExportNamedDeclaration' && node.declaration)
          return isQualifiedType(node.declaration)
      }

      for (const node of nodes) {
        const qualified = isQualifiedType(node)
        if (qualified)
          return qualified
      }
    }
  }

  function processDefineExpose(node: Node): boolean {
    if (!isCallOf(node, DEFINE_EXPOSE))
      return false

    if (exposeDecl)
      error(`duplicate ${DEFINE_EXPOSE}() call`, node)

    if (node.arguments.length !== 1)
      error(`${DEFINE_EXPOSE}() requires one argument`, node)

    exposeDecl = node.arguments[0]

    return true
  }

  function genRuntimeProps(props: Record<string, PropTypeData>) {
    const keys = Object.keys(props)
    if (!keys.length)
      return undefined

    // check defaults. If the default object is an object literal with only
    // static properties, we can directly generate more optimzied default
    // decalrations. Otherwise we will have to fallback to runtime merging.
    const hasStaticDefaults = propsRuntimeDefaults
      && propsRuntimeDefaults.type === 'ObjectExpression'
      && propsRuntimeDefaults.properties.every(
        node => node.type === 'ObjectProperty' && !node.computed,
      )

    return t.objectExpression(
      Object.entries(props).map(([key, value]) => {
        if (value.type === 'null')
          return t.objectProperty(t.identifier(key), t.nullLiteral())

        const prop = hasStaticDefaults
          ? (propsRuntimeDefaults as ObjectExpression).properties.find((node: any) => node.key.name === key) as ObjectProperty
          : undefined

        if (prop)
          value.required = false

        const entries = Object.entries(value).map(([key, value]) => key === 'type'
          ? t.objectProperty(t.identifier(key), typeof value === 'string' ? t.identifier(value) : t.arrayExpression(value.map((i: any) => t.identifier(i))) as any)
          : t.objectProperty(t.identifier(key), parseExpression(JSON.stringify(value)) as any),
        )

        if (prop)
          entries.push(t.objectProperty(t.identifier('default'), prop.value as any))

        return t.objectProperty(
          t.identifier(key),
          t.objectExpression(entries),
        )
      }),
    )
  }

  function getProps() {
    if (propsRuntimeDecl)
      return propsRuntimeDecl

    if (propsTypeDecl) {
      extractRuntimeProps(propsTypeDecl, typeDeclaredProps, declaredTypes)
      return genRuntimeProps(typeDeclaredProps)
    }
  }

  function throwIfAwait(node: Node) {
    if (node.type === 'AwaitExpression')
      error('top-level await is not supported in Vue 2', node)
  }

  nodes = nodes
    .map((raw: Node) => {
      let node = raw
      if (raw.type === 'ExpressionStatement')
        node = raw.expression

      if (node.type === 'VariableDeclaration' && !node.declare) {
        const total = node.declarations.length
        for (let i = 0; i < total; i++) {
          const decl = node.declarations[i]
          if (decl.init) {
            if (processDefineEmits(decl.init))
              decl.init = t.memberExpression(t.identifier('__ctx'), t.identifier('emit')) as any
            else if (processDefineProps(decl.init) || processWithDefaults(decl.init))
              decl.init = t.identifier('__props') as any
            else
              throwIfAwait(decl.init)
          }
        }
      }

      if (processDefineEmits(node) || processDefineProps(node) || processDefineExpose(node))
        return null

      throwIfAwait(node)

      return raw
    })
    .filter(Boolean) as Statement[]

  return {
    nodes,
    props: getProps(),
    expose: exposeDecl,
  }
}

function isCallOf(
  node: Node | null | undefined,
  test: string | ((id: string) => boolean),
): node is CallExpression {
  return !!(
    node
    && node.type === 'CallExpression'
    && node.callee.type === 'Identifier'
    && (typeof test === 'string'
      ? node.callee.name === test
      : test(node.callee.name))
  )
}

function extractRuntimeProps(
  node: TSTypeLiteral | TSInterfaceBody,
  props: Record<string, PropTypeData>,
  declaredTypes: Record<string, string[]>,
) {
  const members = node.type === 'TSTypeLiteral' ? node.members : node.body
  for (const m of members) {
    if (
      (m.type === 'TSPropertySignature' || m.type === 'TSMethodSignature')
      && m.key.type === 'Identifier'
    ) {
      let type: string[] | undefined
      if (m.type === 'TSMethodSignature') {
        type = ['Function']
      }
      else if (m.typeAnnotation) {
        type = inferRuntimeType(
          m.typeAnnotation.typeAnnotation,
          declaredTypes,
        )
      }
      props[m.key.name] = {
        key: m.key.name,
        required: !m.optional,
        type: type?.length === 1 ? type[0] : type || 'null',
      }
    }
  }
}

function inferRuntimeType(
  node: TSType,
  declaredTypes: Record<string, string[]>,
): string[] {
  switch (node.type) {
    case 'TSStringKeyword':
      return ['String']
    case 'TSNumberKeyword':
      return ['Number']
    case 'TSBooleanKeyword':
      return ['Boolean']
    case 'TSObjectKeyword':
      return ['Object']
    case 'TSTypeLiteral':
      // TODO (nice to have) generate runtime property validation
      return ['Object']
    case 'TSFunctionType':
      return ['Function']
    case 'TSArrayType':
    case 'TSTupleType':
      // TODO (nice to have) generate runtime element type/length checks
      return ['Array']

    case 'TSLiteralType':
      switch (node.literal.type) {
        case 'StringLiteral':
          return ['String']
        case 'BooleanLiteral':
          return ['Boolean']
        case 'NumericLiteral':
        case 'BigIntLiteral':
          return ['Number']
        default:
          return ['null']
      }

    case 'TSTypeReference':
      if (node.typeName.type === 'Identifier') {
        if (declaredTypes[node.typeName.name])
          return declaredTypes[node.typeName.name]

        switch (node.typeName.name) {
          case 'Array':
          case 'Function':
          case 'Object':
          case 'Set':
          case 'Map':
          case 'WeakSet':
          case 'WeakMap':
            return [node.typeName.name]
          case 'Record':
          case 'Partial':
          case 'Readonly':
          case 'Pick':
          case 'Omit':
          case 'Exclude':
          case 'Extract':
          case 'Required':
          case 'InstanceType':
            return ['Object']
        }
      }
      return ['null']

    case 'TSParenthesizedType':
      return inferRuntimeType(node.typeAnnotation, declaredTypes)
    case 'TSUnionType':
      return [
        ...new Set(
          [].concat(
            ...(node.types.map(t => inferRuntimeType(t, declaredTypes)) as any),
          ),
        ),
      ]
    case 'TSIntersectionType':
      return ['Object']

    default:
      return ['null'] // no runtime check
  }
}

import {
  Node,
  Declaration,
  ObjectPattern,
  ObjectExpression,
  ArrayPattern,
  Identifier,
  ExportSpecifier,
  Function as FunctionNode,
  TSType,
  TSTypeLiteral,
  TSFunctionType,
  ObjectProperty,
  ArrayExpression,
  Statement,
  CallExpression,
  RestElement,
  TSInterfaceBody,
  AwaitExpression,
  VariableDeclarator,
  VariableDeclaration,
} from '@babel/types'
import { types as t } from '@babel/core'
import { PropTypeData } from './types'

// Special compiler macros
const DEFINE_PROPS = 'defineProps'
const DEFINE_EMITS = 'defineEmits'
const DEFINE_EXPOSE = 'defineExpose'
const WITH_DEFAULTS = 'withDefaults'

export function applyMacros(nodes: Statement[]) {
  let hasDefinePropsCall = false
  let hasDefineEmitCall = false
  const hasDefineExposeCall = false
  let propsRuntimeDecl: Node | undefined
  let propsRuntimeDefaults: Node | undefined
  let propsTypeDecl: TSTypeLiteral | TSInterfaceBody | undefined
  let propsTypeDeclRaw: Node | undefined
  let propsIdentifier: string | undefined
  let emitsRuntimeDecl: Node | undefined
  let emitsTypeDecl:
  | TSFunctionType
  | TSTypeLiteral
  | TSInterfaceBody
  | undefined
  let emitsTypeDeclRaw: Node | undefined
  let emitIdentifier: string | undefined

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
    if (isCallOf(node, DEFINE_EXPOSE))
      error(`Vue 2 does not support ${DEFINE_EXPOSE}()`, node)
    return false
  }

  /* function genRuntimeProps(props: Record<string, PropTypeData>) {
    const keys = Object.keys(props)
    if (!keys.length)
      return ''

    // check defaults. If the default object is an object literal with only
    // static properties, we can directly generate more optimzied default
    // decalrations. Otherwise we will have to fallback to runtime merging.
    const hasStaticDefaults
      = propsRuntimeDefaults
      && propsRuntimeDefaults.type === 'ObjectExpression'
      && propsRuntimeDefaults.properties.every(
        node => node.type === 'ObjectProperty' && !node.computed,
      )

    let propsDecls = `{
    ${keys
    .map((key) => {
      let defaultString: string | undefined
      if (hasStaticDefaults) {
        const prop = (
          propsRuntimeDefaults as ObjectExpression
        ).properties.find(
          (node: any) => node.key.name === key,
        ) as ObjectProperty
        if (prop) {
          // prop has corresponding static default value
          defaultString = `default: ${source.slice(
            prop.value.start! + startOffset,
            prop.value.end! + startOffset,
          )}`
        }
      }

      const { type, required } = props[key]
      return `${key}: { type: ${toRuntimeTypeString(
        type,
      )}, required: ${required}${
        defaultString ? `, ${defaultString}` : ''
      } }`
    })
    .join(',\n    ')}\n  }`

    if (propsRuntimeDefaults && !hasStaticDefaults) {
      propsDecls = `${helper('mergeDefaults')}(${propsDecls}, ${source.slice(
        propsRuntimeDefaults.start! + startOffset,
        propsRuntimeDefaults.end! + startOffset,
      )})`
    }

    return `\n  props: ${propsDecls} as unknown as undefined,`
  } */

  nodes = nodes
    .map((node) => {
      if (node.type === 'VariableDeclaration' && !node.declare) {
        const total = node.declarations.length
        for (let i = 0; i < total; i++) {
          const decl = node.declarations[i]
          if (decl.init) {
            if (processDefineEmits(decl.init))
              decl.init = t.memberExpression(t.identifier('__ctx'), t.identifier('emit')) as any
            else if (processDefineProps(decl.init) || processWithDefaults(decl.init))
              decl.init = t.identifier('__props') as any
          }
        }
      }

      if (processDefineEmits(node) || processDefineProps(node) || processDefineExpose(node))
        return null

      return node
    })
    .filter(Boolean) as Statement[]

  return {
    nodes,
    props: propsRuntimeDecl,
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

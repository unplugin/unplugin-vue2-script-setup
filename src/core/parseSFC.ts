/* eslint-disable one-var */
/* eslint-disable @typescript-eslint/no-namespace */
import { createRequire } from 'module'
import { notNullish, partition } from '@antfu/utils'
import type { Program } from '@babel/types'
import type { ParserPlugin } from '@babel/parser'
import type {
  AttributeNode,
  DirectiveNode,
  ExpressionNode,
  PlainElementNode,
  RootNode,
  TemplateChildNode,
} from '@vue/compiler-core'
import { baseParse } from '@vue/compiler-core'
import { parserOptions } from '@vue/compiler-dom'
import { camelize } from '@vue/shared'
import type {
  ParsedSFC,
  ScriptSetupTransformOptions,
  ScriptTagMeta,
} from '../types'
import { getFileGlobals } from './identifiers'
import { parse } from './babel'
import { exhaustiveCheckReturnUndefined, pascalize } from './utils'

namespace NodeTypes {
  export const ROOT = 0,
    ELEMENT = 1,
    TEXT = 2,
    COMMENT = 3,
    SIMPLE_EXPRESSION = 4,
    INTERPOLATION = 5,
    ATTRIBUTE = 6,
    DIRECTIVE = 7,
    COMPOUND_EXPRESSION = 8,
    IF = 9,
    IF_BRANCH = 10,
    FOR = 11,
    TEXT_CALL = 12,
    VNODE_CALL = 13,
    JS_CALL_EXPRESSION = 14,
    JS_OBJECT_EXPRESSION = 15,
    JS_PROPERTY = 16,
    JS_ARRAY_EXPRESSION = 17,
    JS_FUNCTION_EXPRESSION = 18,
    JS_CONDITIONAL_EXPRESSION = 19,
    JS_CACHE_EXPRESSION = 20,
    JS_BLOCK_STATEMENT = 21,
    JS_TEMPLATE_LITERAL = 22,
    JS_IF_STATEMENT = 23,
    JS_ASSIGNMENT_EXPRESSION = 24,
    JS_SEQUENCE_EXPRESSION = 25,
    JS_RETURN_STATEMENT = 26
}

namespace ElementTypes {
  export const ELEMENT = 0,
    COMPONENT = 1,
    SLOT = 2,
    TEMPLATE = 3
}

const BUILD_IN_DIRECTIVES = new Set([
  'if',
  'else',
  'else-if',
  'for',
  'once',
  'model',
  'on',
  'bind',
  'slot',
  'slot-scope',
  'key',
  'ref',
  'text',
  'html',
  'show',
  'pre',
  'cloak',
  // 'el',
  // 'ref',
])

function getRequire() {
  return (
    (typeof require === 'function')
      ? require
      : createRequire(import.meta.url)
  )
}

function getComponents(node: TemplateChildNode): string[] {
  const current
    = node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.COMPONENT
      ? [node.tag]
      : node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.ELEMENT
        ? [node.tag]
        : []

  const children
    = node.type === NodeTypes.IF
      ? node.branches
      : node.type === NodeTypes.ELEMENT
        || node.type === NodeTypes.IF_BRANCH
        || node.type === NodeTypes.FOR
        ? node.children
        : node.type === NodeTypes.TEXT
        || node.type === NodeTypes.COMMENT
        || node.type === NodeTypes.COMPOUND_EXPRESSION
        || node.type === NodeTypes.TEXT_CALL
        || node.type === NodeTypes.INTERPOLATION
          ? []
          : exhaustiveCheckReturnUndefined(node) ?? []

  return [...current, ...children.flatMap(getComponents)]
}

function getDirectiveNames(node: TemplateChildNode): string[] {
  if (node.type === NodeTypes.ELEMENT) {
    const directives = node.props.flatMap(x =>
      x.type === NodeTypes.DIRECTIVE ? [x.name] : [],
    )
    return [...directives, ...node.children.flatMap(getDirectiveNames)]
  }
  else if (node.type === NodeTypes.IF) {
    return node.branches.flatMap(getDirectiveNames)
  }
  else if (node.type === NodeTypes.IF_BRANCH || node.type === NodeTypes.FOR) {
    return node.children.flatMap(getDirectiveNames)
  }
  else if (
    node.type === NodeTypes.INTERPOLATION
    || node.type === NodeTypes.COMPOUND_EXPRESSION
    || node.type === NodeTypes.TEXT
    || node.type === NodeTypes.COMMENT
    || node.type === NodeTypes.TEXT_CALL
  ) {
    return []
  }
  else {
    exhaustiveCheckReturnUndefined(node)
    return []
  }
}

function getFreeVariablesForText(input: string): string[] {
  const inputWithPrefix = input.trimStart()[0] === '{' ? `(${input})` : input
  return getFileGlobals(parse(inputWithPrefix))
}

function getFreeVariablesForPropsNode(
  node: AttributeNode | DirectiveNode,
): string[] {
  if (node.type === NodeTypes.DIRECTIVE) {
    const arg = node.arg === undefined ? [] : getFreeVariablesForNode(node.arg)
    const exp = node.exp === undefined ? [] : getFreeVariablesForNode(node.exp)
    return [...arg, ...exp]
  }
  return []
}

function getFreeVariablesForNode(
  node: TemplateChildNode | ExpressionNode,
): string[] {
  if (node.type === NodeTypes.SIMPLE_EXPRESSION) {
    return node.isStatic ? [] : getFreeVariablesForText(node.content)
  }
  else if (node.type === NodeTypes.COMPOUND_EXPRESSION) {
    return node.children.flatMap(x =>
      typeof x !== 'object' ? [] : getFreeVariablesForNode(x),
    )
  }
  else if (node.type === NodeTypes.INTERPOLATION) {
    return getFreeVariablesForNode(node.content)
  }
  else if (node.type === NodeTypes.ELEMENT) {
    const children = node.children.flatMap(getFreeVariablesForNode)

    const directiveProps = node.props.flatMap(x =>
      x.type === NodeTypes.DIRECTIVE ? [x] : [],
    )
    const attributeProps = node.props.flatMap(x =>
      x.type === NodeTypes.ATTRIBUTE ? [x] : [],
    )

    const refNode = attributeProps.find(
      node => node.name === 'ref' && node.value !== undefined,
    )
    const refIdentifier = refNode?.value?.content

    const vSlotNode = directiveProps.find(node => node.name === 'slot')
    const vSlotArgIdentifiers
      = vSlotNode?.arg === undefined ? [] : getFreeVariablesForNode(vSlotNode.arg)
    // TODO: Variable shadowing
    const vSlotExpVariableShadowingIdentifiers: string[] = []

    const vForNode = directiveProps.find(node => node.name === 'for')
    const vForIdentifiers
      = vForNode?.exp?.type === NodeTypes.SIMPLE_EXPRESSION
        ? getFreeVariablesForText(
          vForNode.exp.content.replace(/^.*\s(?:in|of)\s/, ''),
        )
        : []
    // TODO: Variable shadowing
    const vForExpVariableShadowingIdentifiers: string[] = []

    const props = directiveProps
      .filter(({ name }) => name !== 'slot' && name !== 'for')
      .flatMap(getFreeVariablesForPropsNode)

    const shadowingIdentifiers = new Set([
      ...vSlotExpVariableShadowingIdentifiers,
      ...vForExpVariableShadowingIdentifiers,
    ])
    return [
      ...vSlotArgIdentifiers,
      refIdentifier,
      ...vForIdentifiers,
      ...[...children, ...props].filter(x => !shadowingIdentifiers.has(x)),
    ].filter(notNullish)
  }
  else if (node.type === NodeTypes.FOR) {
    // If we use `baseCompiler`, we need add variable shadowing here
    // But we use `baseParse` now. So this branch will never be reached.
    // `NodeTypes.IF` and `NodeTypes.IF_BRANCH` will never be reached, also.

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { keyAlias, valueAlias } = node
    return [node.source, ...node.children].flatMap(getFreeVariablesForNode)
  }
  else if (node.type === NodeTypes.IF) {
    return (node.branches ?? []).flatMap(getFreeVariablesForNode)
  }
  else if (node.type === NodeTypes.IF_BRANCH) {
    return [node.condition, ...node.children]
      .filter(notNullish)
      .flatMap(getFreeVariablesForNode)
  }
  else if (
    node.type === NodeTypes.TEXT
    || node.type === NodeTypes.COMMENT
    || node.type === NodeTypes.TEXT_CALL
  ) {
    return []
  }
  else {
    exhaustiveCheckReturnUndefined(node)
    return []
  }
}

export function findReferencesForSFC(
  templateNode: RootNode | PlainElementNode | undefined,
) {
  const components = templateNode?.children.flatMap(getComponents) ?? []
  const directives = templateNode?.children.flatMap(getDirectiveNames) ?? []
  const identifiers
    = templateNode?.children.flatMap(getFreeVariablesForNode) ?? []

  return {
    components,
    directives,
    identifiers,
  }
}

function getBabelParserOptions(lang: string | null | undefined) {
  lang = lang || 'js'
  const pluginsDict: Record<string, Array<ParserPlugin>> = {
    js: [],
    ts: ['typescript'],
    jsx: ['jsx'],
    tsx: ['jsx', 'typescript'],
  }
  const plugins = pluginsDict[lang]
  if (plugins === undefined)
    throw new SyntaxError(`Unsupported script language: ${lang}`)
  return {
    sourceType: 'module' as const,
    plugins,
  }
}
export function parseSFC(
  code: string,
  id?: string,
  options?: ScriptSetupTransformOptions,
): ParsedSFC {
  const elementChildren = baseParse(code, parserOptions).children.flatMap(x =>
    x.type === NodeTypes.ELEMENT && x.tagType === ElementTypes.ELEMENT
      ? [x]
      : [],
  )
  const templateNode = elementChildren.find(x => x.tag === 'template')

  const [scriptSetupChildNodes, scriptChildNodes] = partition(
    elementChildren.filter(x => x.tag === 'script'),
    x => x.props.some(p => p.type === NodeTypes.ATTRIBUTE && p.name === 'setup'),
  )

  const getScriptTagMeta = (
    n: PlainElementNode | undefined,
    astTransforms: (ast: Program) => Program = x => x,
  ): ScriptTagMeta => {
    if (n === undefined) {
      const content = ''
      const ast = parse(content, {
        sourceType: 'module',
        plugins: [],
      }).program
      return {
        start: 0,
        end: 0,
        contentStart: 0,
        contentEnd: 0,
        content,
        attrs: {},
        found: false,
        ast,
      }
    }
    const attrs = Object.fromEntries(
      n.props.flatMap(x =>
        !(
          x.type === NodeTypes.ATTRIBUTE && typeof x.value?.content === 'string'
        )
          ? []
          : [[x.name, x.value.content]],
      ),
    )
    const content = n.children[0]?.loc.source ?? ''
    const contentStart = n.children[0]?.loc.start.offset ?? 0
    const contentEnd = n.children[0]?.loc.end.offset ?? 0
    const ast = astTransforms(
      parse(content, getBabelParserOptions(attrs.lang)).program,
    )
    return {
      start: n.loc.start.offset,
      end: n.loc.end.offset,
      contentStart,
      contentEnd,
      content,
      attrs,
      found: true,
      ast,
    }
  }
  const scriptSetup = getScriptTagMeta(
    scriptSetupChildNodes[0],
    options?.astTransforms?.scriptSetup,
  )
  const script = getScriptTagMeta(
    scriptChildNodes[0],
    options?.astTransforms?.script,
  )

  if (
    script.found
    && scriptSetup.found
    && scriptSetup.attrs.lang !== script.attrs.lang
  ) {
    throw new SyntaxError(
      '<script setup> language must be the same as <script>',
    )
  }

  const codeOfTemplate
    = templateNode == null
      ? undefined
      : templateNode.props.some(
        p =>
          p.type === NodeTypes.ATTRIBUTE
            && p.name === 'lang'
            && p.value?.type === NodeTypes.TEXT
            && p.value.content === 'pug',
      )
        ? baseParse(
          getRequire()('pug').compile(
            templateNode.children.map(x => x.loc.source).join(''),
            {
              filename: id,
            },
          )(),
          parserOptions,
        )
        : templateNode

  const result = codeOfTemplate
    ? findReferencesForSFC(codeOfTemplate)
    : undefined

  return {
    id,
    template: {
      components: new Set(result?.components.map(pascalize)),
      directives: new Set(
        result?.directives
          .filter(x => !BUILD_IN_DIRECTIVES.has(x))
          .map(camelize),
      ),
      identifiers: new Set(result?.identifiers),
    },
    scriptSetup,
    script,
    parserOptions: getBabelParserOptions(
      script.attrs.lang ?? scriptSetup.attrs.lang,
    ),
    extraDeclarations: [],
  }
}

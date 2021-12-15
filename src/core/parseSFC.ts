/* eslint-disable one-var */
/* eslint-disable @typescript-eslint/no-namespace */
import type { ParserOptions as HTMLParserOptions } from 'htmlparser2'
import { Parser as HTMLParser } from 'htmlparser2'
import type { ParserOptions } from '@babel/parser'
import type {
  AttributeNode,
  DirectiveNode,
  TemplateChildNode,
  ExpressionNode,
} from '@vue/compiler-core'
import { baseParse } from '@vue/compiler-core'
import { parserOptions } from '@vue/compiler-dom'
import { camelize } from '@vue/shared'
import type {
  ParsedSFC,
  ScriptSetupTransformOptions,
  ScriptTagMeta,
} from '../types'
import { getIdentifierUsages } from './identifiers'
import { parse } from './babel'
import { exhaustiveCheckReturnUndefined, isNotNil, pascalize } from './utils'

namespace NodeTypes {
  export const
    ROOT = 0,
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
  export const
    ELEMENT = 0,
    COMPONENT = 1,
    SLOT = 2,
    TEMPLATE = 3
}

const multilineCommentsRE = /\/\*\s(.|[\r\n])*?\*\//gm
const singlelineCommentsRE = /\/\/\s.*/g

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
  const identifiers = new Set<string>()
  const inputWithPrefix = input.trimStart()[0] === '{' ? `(${input})` : input

  const nodes = parse(inputWithPrefix).program.body
  nodes.forEach(node => getIdentifierUsages(node, identifiers))
  return [...identifiers.values()]
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

    const directiveProps = node.props
      .flatMap(x =>
        x.type === NodeTypes.DIRECTIVE ? [x] : [],
      )
    const attributeProps = node.props
      .flatMap(x =>
        x.type === NodeTypes.ATTRIBUTE ? [x] : [],
      )

    const refNode = attributeProps.find(node => node.name === 'ref' && node.value !== undefined)
    const refIdentifier = refNode?.value?.content

    const vSlotNode = directiveProps.find(node => node.name === 'slot')
    const vSlotArgIdentifiers = vSlotNode?.arg === undefined ? [] : getFreeVariablesForNode(vSlotNode.arg)
    // TODO: Variable shadowing
    const vSlotExpVariableShadowingIdentifiers: string[] = []

    const vForNode = directiveProps.find(node => node.name === 'for')
    const vForIdentifiers = vForNode?.exp?.type === NodeTypes.SIMPLE_EXPRESSION ? getFreeVariablesForText(vForNode.exp.content.replace(/^.*\s(?:in|of)\s/, '')) : []
    // TODO: Variable shadowing
    const vForExpVariableShadowingIdentifiers: string[] = []

    const props = directiveProps
      .filter(({ name }) => name !== 'slot' && name !== 'for')
      .flatMap(getFreeVariablesForPropsNode)

    const shadowingIdentifiers = new Set([...vSlotExpVariableShadowingIdentifiers, ...vForExpVariableShadowingIdentifiers])
    return [
      ...vSlotArgIdentifiers,
      refIdentifier,
      ...vForIdentifiers,
      ...([...children, ...props]).filter(x => !shadowingIdentifiers.has(x)),
    ].filter(isNotNil)
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
      .filter(isNotNil)
      .flatMap(getFreeVariablesForNode)
  }
  else if (node.type === NodeTypes.TEXT || node.type === NodeTypes.COMMENT || node.type === NodeTypes.TEXT_CALL) {
    return []
  }
  else {
    exhaustiveCheckReturnUndefined(node)
    return []
  }
}

export function findReferencesForSFC(code: string) {
  const rootNode = baseParse(code, parserOptions)
  const templateChildNodes = rootNode.children.flatMap(node =>
    node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.ELEMENT
      ? [node]
      : [],
  )

  const templateNode = templateChildNodes.find(
    ({ tag }) => tag === 'template',
  )

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

const htmlParserOptions: HTMLParserOptions = {
  xmlMode: true,
  lowerCaseTags: false,
  lowerCaseAttributeNames: false,
  recognizeSelfClosing: true,
}
export function parseSFC(
  code: string,
  id?: string,
  options?: ScriptSetupTransformOptions,
): ParsedSFC {
  let templateLevel = 0
  let inScriptSetup = false
  let inScript = false

  const striped = code
    .replace(multilineCommentsRE, r => ' '.repeat(r.length))
    .replace(singlelineCommentsRE, r => ' '.repeat(r.length))

  const scriptSetup: ScriptTagMeta = {
    start: 0,
    end: 0,
    contentStart: 0,
    contentEnd: 0,
    content: '',
    attrs: {},
    found: false,
    ast: undefined!,
  }
  const script: ScriptTagMeta = {
    start: 0,
    end: 0,
    contentStart: 0,
    contentEnd: 0,
    content: '',
    attrs: {},
    found: false,
    ast: undefined!,
  }

  let templateStart: number | undefined
  let templateEnd: number | undefined
  let templateLang: 'html' | 'pug' = 'html'
  const parser = new HTMLParser(
    {
      onopentag(name, attributes) {
        if (!name) return

        if (name === 'template') {
          if (templateLevel === 0) {
            templateStart = parser.endIndex! + 1
            if (attributes.lang === 'pug')
              templateLang = 'pug'
          }
          templateLevel += 1
        }

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
      },
      onclosetag(name) {
        if (name === 'template') {
          templateLevel -= 1
          if (templateLevel === 0 && templateStart != null)
            templateEnd = parser.startIndex
        }

        if (inScriptSetup && name === 'script') {
          scriptSetup.end = parser.endIndex! + 1
          scriptSetup.contentEnd = parser.startIndex
          scriptSetup.content = code.slice(
            scriptSetup.contentStart,
            scriptSetup.contentEnd,
          )
          inScriptSetup = false
        }
        if (inScript && name === 'script') {
          script.end = parser.endIndex! + 1
          script.contentEnd = parser.startIndex
          script.content = code.slice(script.contentStart, script.contentEnd)
          inScript = false
        }
      },
    },
    htmlParserOptions,
  )

  parser.write(striped)
  parser.end()

  if (
    script.found
    && scriptSetup.found
    && scriptSetup.attrs.lang !== script.attrs.lang
  ) {
    throw new SyntaxError(
      '<script setup> language must be the same as <script>',
    )
  }

  const parserOptions: ParserOptions = {
    sourceType: 'module',
    plugins: [],
  }

  const lang = scriptSetup.attrs.lang || script.attrs.lang || 'js'
  if (lang === 'ts') parserOptions.plugins!.push('typescript')
  else if (lang === 'jsx') parserOptions.plugins!.push('jsx')
  else if (lang === 'tsx') parserOptions.plugins!.push('typescript', 'jsx')
  else if (lang !== 'js')
    throw new SyntaxError(`Unsupported script language: ${lang}`)

  scriptSetup.ast = parse(scriptSetup.content, parserOptions).program
  script.ast = parse(script.content || '', parserOptions).program

  scriptSetup.ast
    = options?.astTransforms?.scriptSetup?.(scriptSetup.ast) || scriptSetup.ast
  script.ast = options?.astTransforms?.script?.(script.ast) || script.ast

  const codeOfTemplate = (() => {
    if (templateStart == null || templateEnd == null)
      return undefined

    const templateCode = code.slice(templateStart, templateEnd)
    const html
      = templateLang === 'html'
        ? templateCode
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        : require('pug').compile(templateCode, { filename: id })()
    return `<template>\n${html}\n</template>`
  })()

  const a = codeOfTemplate ? findReferencesForSFC(codeOfTemplate) : undefined

  return {
    id,
    template: {
      components: new Set(a?.components.map(pascalize)),
      directives: new Set(a?.directives.filter(x => !BUILD_IN_DIRECTIVES.has(x)).map(camelize)),
      identifiers: new Set(a?.identifiers),
    },
    scriptSetup,
    script,
    parserOptions,
    extraDeclarations: [],
  }
}

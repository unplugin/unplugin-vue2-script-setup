import { Parser as HTMLParser } from 'htmlparser2'
import { parse } from '@babel/parser'
import { PrivateName, Expression, Statement, SpreadElement } from '@babel/types'
import { camelize, capitalize, isHTMLTag, isSVGTag, isVoidTag } from '@vue/shared'
import { ParseResult, TagMeta } from './types'

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
      if (!name)
        return

      if (name === 'template')
        templateLevel += 1

      if (templateLevel > 0) {
        if (!isHTMLTag(name) && !isSVGTag(name) && !isVoidTag(name))
          components.add(capitalize(camelize(name)))
        Object.entries(attributes).forEach(([key, value]) => {
          if (!value)
            return
          if (key.startsWith('v-') || key.startsWith('@') || key.startsWith(':')) {
            if (key === 'v-for')
              // we strip out delectations for v-for before `in` or `of`
              expressions.add(`(${value.replace(/^.*?\w(?:in|of)\w/, '')})`)
            else
              expressions.add(`(${value})`)
          }
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
          expressions.add(`(${expression})`)
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

  expressions.forEach((exp) => {
    const nodes = parse(exp).program.body
    nodes.forEach(node => getIdentifiersUsage(node, identifiers))
  })

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

export function getIdentifiersDeclaration(nodes: Statement[], identifiers = new Set<string>()) {
  for (const node of nodes) {
    if (node.type === 'ImportDeclaration') {
      for (const specifier of node.specifiers)
        identifiers.add(specifier.local.name)
    }
    else if (node.type === 'VariableDeclaration') {
      for (const declarator of node.declarations) {
        if (declarator.id.type === 'Identifier') {
          identifiers.add(declarator.id.name)
        }
        else if (declarator.id.type === 'ObjectPattern') {
          for (const property of declarator.id.properties) {
            if (property.type === 'ObjectProperty' && property.key.type === 'Identifier')
              identifiers.add(property.key.name)
            else if (property.type === 'RestElement' && property.argument.type === 'Identifier')
              identifiers.add(property.argument.name)
          }
        }
        else if (declarator.id.type === 'ArrayPattern') {
          for (const element of declarator.id.elements) {
            if (element?.type === 'Identifier')
              identifiers.add(element.name)
            else if (element?.type === 'RestElement' && element.argument.type === 'Identifier')
              identifiers.add(element.argument.name)
          }
        }
      }
    }
    else if (node.type === 'FunctionDeclaration') {
      if (node.id)
        identifiers.add(node.id.name)
    }
    // else {
    //   console.log(node)
    // }
  }
  return identifiers
}

export function getIdentifiersUsage(node?: Expression | SpreadElement | PrivateName | Statement | null, identifiers = new Set<string>()) {
  if (!node)
    return identifiers

  if (node.type === 'ExpressionStatement') {
    getIdentifiersUsage(node.expression, identifiers)
  }
  else if (node.type === 'Identifier') {
    identifiers.add(node.name)
  }
  else if (node.type === 'MemberExpression') {
    getIdentifiersUsage(node.object, identifiers)
  }
  else if (node.type === 'CallExpression') {
    // @ts-expect-error
    getIdentifiersUsage(node.callee, identifiers)
    node.arguments.forEach((arg) => {
      // @ts-expect-error
      getIdentifiersUsage(arg, identifiers)
    })
  }
  else if (node.type === 'BinaryExpression' || node.type === 'LogicalExpression') {
    getIdentifiersUsage(node.left, identifiers)
    getIdentifiersUsage(node.right, identifiers)
  }
  else if (node.type === 'UnaryExpression') {
    getIdentifiersUsage(node.argument, identifiers)
  }
  else if (node.type === 'ForOfStatement' || node.type === 'ForInStatement') {
    getIdentifiersUsage(node.right, identifiers)
  }
  else if (node.type === 'ConditionalExpression') {
    getIdentifiersUsage(node.test, identifiers)
    getIdentifiersUsage(node.consequent, identifiers)
    getIdentifiersUsage(node.alternate, identifiers)
  }
  else if (node.type === 'ObjectExpression') {
    node.properties.forEach((prop) => {
      if (prop.type === 'ObjectProperty')
        getIdentifiersUsage(prop.key, identifiers)
      else if (prop.type === 'SpreadElement')
        getIdentifiersUsage(prop, identifiers)
    })
  }
  else if (node.type === 'ArrayExpression') {
    node.elements.forEach((element) => {
      getIdentifiersUsage(element, identifiers)
    })
  }
  else if (node.type === 'SpreadElement') {
    getIdentifiersUsage(node.argument, identifiers)
  }
  // else {
  //   console.log(node)
  // }
  return identifiers
}

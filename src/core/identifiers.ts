import type {
  Expression,
  File,
  PrivateName,
  SpreadElement,
  Statement,
  TSType,
} from '@babel/types'
import type { ParseResult } from '@babel/parser'
import { t, traverse } from './babel'

export function getIdentifierDeclarations(nodes: Statement[]) {
  let result!: Set<string>
  let programScopeUid: number
  traverse(t.file(t.program(nodes)), {
    Program(path) {
      result = new Set(Object.keys(path.scope.bindings))
      programScopeUid = (path.scope as any).uid
    },
    // FIXME: babel bug, temporary add TSEnumDeclaration and TSModuleDeclaration logic
    TSEnumDeclaration(path) {
      if ((path.scope as any).uid === programScopeUid)
        result.add(path.node.id.name)
    },
    TSModuleDeclaration(path) {
      if ((path.scope as any).uid === programScopeUid) {
        const id = path.node.id
        if (id.type === 'Identifier')
          result.add(id.name)
      }
    },
  })
  return Array.from(result)
}

/**
 * @deprecated use `getFileGlobals` instead
 */
export function getIdentifierUsages(node?: Expression | TSType | SpreadElement | PrivateName | Statement | null, identifiers = new Set<string>()) {
  if (!node)
    return identifiers

  if (node.type === 'BlockStatement') {
    node.body.forEach(child => getIdentifierUsages(child, identifiers))
  }
  else if (node.type === 'ExpressionStatement') {
    getIdentifierUsages(node.expression, identifiers)
  }
  else if (node.type === 'Identifier') {
    identifiers.add(node.name)
  }
  else if (node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression') {
    getIdentifierUsages(node.object, identifiers)
    if (node.computed)
      getIdentifierUsages(node.property, identifiers)
  }
  else if (node.type === 'CallExpression' || node.type === 'OptionalCallExpression') {
    getIdentifierUsages(node.callee as Expression, identifiers)
    node.arguments.forEach(arg => getIdentifierUsages(arg as Expression, identifiers))
  }
  else if (node.type === 'BinaryExpression' || node.type === 'LogicalExpression') {
    getIdentifierUsages(node.left, identifiers)
    getIdentifierUsages(node.right, identifiers)
  }
  else if (node.type === 'UnaryExpression') {
    getIdentifierUsages(node.argument, identifiers)
  }
  else if (node.type === 'ForOfStatement' || node.type === 'ForInStatement') {
    getIdentifierUsages(node.right, identifiers)
  }
  else if (node.type === 'ConditionalExpression') {
    getIdentifierUsages(node.test, identifiers)
    getIdentifierUsages(node.consequent, identifiers)
    getIdentifierUsages(node.alternate, identifiers)
  }
  else if (node.type === 'ObjectExpression') {
    node.properties.forEach((prop) => {
      if (prop.type === 'ObjectProperty') {
        if (prop.computed)
          getIdentifierUsages(prop.key, identifiers)
        getIdentifierUsages(prop.value as Expression, identifiers)
      }
      else if (prop.type === 'SpreadElement') {
        getIdentifierUsages(prop, identifiers)
      }
    })
  }
  else if (node.type === 'ArrayExpression') {
    node.elements.forEach(element => getIdentifierUsages(element, identifiers))
  }
  else if (node.type === 'SpreadElement' || node.type === 'ReturnStatement') {
    getIdentifierUsages(node.argument, identifiers)
  }
  else if (node.type === 'NewExpression') {
    getIdentifierUsages(node.callee as Expression, identifiers)
    node.arguments.forEach(arg => getIdentifierUsages(arg as Expression, identifiers))
  }
  else if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
    getIdentifierUsages(node.body, identifiers)
  }
  else if (node.type === 'TemplateLiteral') {
    node.expressions.forEach(expr => getIdentifierUsages(expr, identifiers))
  }
  // else {
  //   console.log(node)
  // }
  return identifiers
}

export function getFileGlobals(result: ParseResult<File>) {
  let globals!: Set<string>
  let programScopeUid: number
  traverse(result, {
    Program(path) {
      globals = new Set(Object.keys((path.scope as any).globals))
      programScopeUid = (path.scope as any).uid
    },
    // FIXME: babel bug, temporary add TSEnumDeclaration and TSModuleDeclaration logic
    TSEnumDeclaration(path) {
      if ((path.scope as any).uid === programScopeUid)
        globals.delete(path.node.id.name)
    },
    TSModuleDeclaration(path) {
      if ((path.scope as any).uid === programScopeUid) {
        const id = path.node.id
        if (id.type === 'Identifier')
          globals.delete(id.name)
      }
    },
  })
  return Array.from(globals)
}

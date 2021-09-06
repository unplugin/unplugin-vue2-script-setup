import { PrivateName, Expression, Statement, SpreadElement, Node, TSType } from '@babel/types'

export function getIdentifierDeclarations(nodes: Statement[], identifiers = new Set<string>()) {
  for (let node of nodes) {
    if (node.type === 'ExportNamedDeclaration') {
      node = node.declaration!
      if (!node)
        continue
    }
    if (node.type === 'ImportDeclaration') {
      for (const specifier of node.specifiers)
        identifiers.add(specifier.local.name)
    }
    else if (node.type === 'VariableDeclaration') {
      function handleVariableId(node: Node) {
        if (node.type === 'Identifier') {
          identifiers.add(node.name)
        }
        else if (node.type === 'ObjectPattern') {
          for (const property of node.properties) {
            if (property.type === 'ObjectProperty')
              handleVariableId(property.value)
            else if (property.type === 'RestElement' && property.argument.type === 'Identifier')
              identifiers.add(property.argument.name)
          }
        }
        else if (node.type === 'ArrayPattern') {
          for (const element of node.elements) {
            if (element?.type === 'Identifier')
              identifiers.add(element.name)
            else if (element?.type === 'RestElement' && element.argument.type === 'Identifier')
              identifiers.add(element.argument.name)
            else if (element?.type === 'ObjectPattern' || element?.type === 'ArrayPattern')
              handleVariableId(element)
          }
        }
      }

      for (const declarator of node.declarations)
        handleVariableId(declarator.id)
    }
    else if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
      if (node.id)
        identifiers.add(node.id.name)
    }
    else if (node.type === 'TSEnumDeclaration') {
      if (node.id)
        identifiers.add(node.id.name)
    }
    // else {
    //   console.log(node)
    // }
  }
  return identifiers
}

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
  else if (node.type === 'MemberExpression') {
    getIdentifierUsages(node.object, identifiers)
  }
  else if (node.type === 'CallExpression') {
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

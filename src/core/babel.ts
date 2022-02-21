import * as babel from '@babel/core'
import { parse, parseExpression } from '@babel/parser'
import g from '@babel/generator'
import * as babel_traverse from '@babel/traverse'

export const t: typeof babel['types'] = ((babel as any).default || babel).types
export const generate: typeof g = ((g as any).default || g)
export const traverse = ((babel_traverse as any)?.default?.default as null) ?? babel_traverse?.default ?? babel_traverse
export { parseExpression, parse }

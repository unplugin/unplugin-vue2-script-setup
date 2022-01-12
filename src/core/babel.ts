import * as babel from '@babel/core'
import { parse, parseExpression } from '@babel/parser'
import g from '@babel/generator'

export const t: typeof babel['types'] = ((babel as any).default || babel).types
export const generate: typeof g = ((g as any).default || g)
export { parseExpression, parse }

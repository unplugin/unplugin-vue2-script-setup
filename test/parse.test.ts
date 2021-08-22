import { parse } from '@babel/parser'
import { getIdentifiersDeclaration, getIdentifiersUsage } from '../src/parse'

describe('parse', () => {
  describe('should identifiers declaration', () => {
    const cases: [string, string[]][] = [
      ['var a = 1', ['a']],
      ['import { foo, t as bar } from "z"', ['foo', 'bar']],
      ['import foo from "z"', ['foo']],
      ['import * as foo from "z"', ['foo']],
      ['function foo(bar) {const a = z}', ['foo']],
      ['console.log(foo)', []],
      ['const { data } = toRefs(state)', ['data']],
      ['const { data, ...args } = bar', ['data', 'args']],
      ['const { foo: bar } = bar', ['foo']],
      ['let [a, b,, ...c] = bar', ['a', 'b', 'c']],
    ]

    for (const [input, output] of cases) {
      it(input, () => {
        const ast = parse(input, {
          sourceType: 'module',
        })

        expect(getIdentifiersDeclaration(ast.program.body)).toEqual(new Set(output))
      })
    }
  })

  describe('should identifiers usage', () => {
    const cases: [string, string[]][] = [
      ['foo', ['foo']],
      ['foo.bar', ['foo']],
      ['foo(bar, console.log)', ['foo', 'bar', 'console']],
      ['for (let x in foo) {}', ['foo']],
      ['for (let [x, idx] of foo) {}', ['foo']],
      ['a + b', ['a', 'b']],
      ['a ? "" : b < c', ['a', 'b', 'c']],
      ['a == b && a === c', ['a', 'b', 'c']],
      ['({ a, b, ...args, [c]: 1 })', ['a', 'b', 'args', 'c']],
      ['!a', ['a']],
      ['[a,b,...args]', ['a', 'b', 'args']],
    ]

    for (const [input, output] of cases) {
      it(input, () => {
        const nodes = parse(input).program.body
        const i = new Set<string>()
        nodes.forEach(node => getIdentifiersUsage(node, i))
        expect(i).toEqual(new Set(output))
      })
    }
  })
})

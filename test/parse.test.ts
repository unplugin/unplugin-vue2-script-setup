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
      ['var { data } = toRefs(state)', ['data']],
      ['const { data, ...args } = bar', ['data', 'args']],
      ['const { foo: bar } = bar', ['bar']],
      ['const { foo: { a, b: c, d: { e: [f] } } } = { bar }', ['a', 'c', 'f']],
      ['let [a, b,, ...c] = bar', ['a', 'b', 'c']],
      ['let [a, b, [c, {d}],, ...e] = bar', ['a', 'b', 'c', 'd', 'e']],
      ['class A extends B {}', ['A']],
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
      ['foo(bar, console.log, ...args)', ['foo', 'bar', 'console', 'args']],
      ['foo(bar())', ['foo', 'bar']],
      ['for (let x in foo) {}', ['foo']],
      ['for (let [x, idx] of foo) {}', ['foo']],
      ['a + b', ['a', 'b']],
      ['a ? "" : b < c', ['a', 'b', 'c']],
      ['a == b && a === c || d != e', ['a', 'b', 'c', 'd', 'e']],
      ['({ a, b, ...args, [c]: 1, d: e, f: { g } })', ['a', 'b', 'args', 'c', 'e', 'g']],
      ['!a', ['a']],
      ['!!c', ['c']],
      ['[a,b,[c,{d}],...args]', ['a', 'b', 'c', 'd', 'args']],
      ['new Foo(a,[b])', ['Foo', 'a', 'b']],
      ['new RC.Foo()', ['RC']],
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

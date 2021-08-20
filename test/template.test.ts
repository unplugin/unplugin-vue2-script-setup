import { parseVueSFC } from '../src'

describe('template', () => {
  it('empty', () => {
    expect(parseVueSFC('').template).toMatchSnapshot()
  })

  it('v-if', () => {
    expect(parseVueSFC('<template><div v-if="foo" v-else /></template>').template).toMatchSnapshot()
  })

  it('v-bind', () => {
    expect(parseVueSFC('<template><div v-bind:value="foo" :value="bar" /></template>').template).toMatchSnapshot()
  })

  it('v-on', () => {
    expect(parseVueSFC('<template><div v-on:click="foo" @click="bar()" /></template>').template).toMatchSnapshot()
  })

  it('ref', () => {
    expect(parseVueSFC('<template><div ref="foo" /></template>').template).toMatchSnapshot()
  })

  it('expressions', () => {
    expect(parseVueSFC('<template><HelloWorld>{{ foo(bar) }} x {{ foobar * 2 }}</HelloWorld></template>').template).toMatchSnapshot()
  })
})

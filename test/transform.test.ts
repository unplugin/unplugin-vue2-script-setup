import { resolve } from 'path'
import { promises as fs } from 'fs'
import { transform } from '../src'

describe('transform', () => {
  it('App.vue', async() => {
    const fixture = await fs.readFile(resolve(__dirname, '../playground/App.vue'), 'utf-8')
    expect(transform(fixture).code).toMatchSnapshot()
  })
  it('HelloWorld.vue', async() => {
    const fixture = await fs.readFile(resolve(__dirname, '../playground/HelloWorld.vue'), 'utf-8')
    expect(transform(fixture).code).toMatchSnapshot()
  })
})

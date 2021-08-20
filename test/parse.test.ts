import { resolve } from 'path'
import { promises as fs } from 'fs'
import { parseVueSFC } from '../src'

describe('parse', () => {
  it('fixture1', async() => {
    const fixture = await fs.readFile(resolve(__dirname, 'fixtures/Fixture1.vue'), 'utf-8')
    expect(parseVueSFC(fixture)).toMatchSnapshot()
  })
})

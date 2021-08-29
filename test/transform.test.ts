import { resolve } from 'path'
import { promises as fs } from 'fs'
import fg from 'fast-glob'
import { transform } from '../src'

describe('transform', () => {
  describe('fixtures', () => {
    const root = resolve(__dirname, '..')
    const files = fg.sync([
      'test/fixtures/*.{vue,js,ts}',
      'playground/*.{vue,js,ts}',
    ], {
      cwd: root,
      onlyFiles: true,
    })

    for (const file of files) {
      it(file.replace(/\\/g, '/'), async() => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

        const fixture = await fs.readFile(resolve(root, file), 'utf-8')
        const result = transform(fixture, file, { refTransform: true })?.code || fixture
        expect(result).toMatchSnapshot()

        const result2 = transform(result, file, { refTransform: true })?.code || result
        expect(result).toEqual(result2)

        warn.mockRestore()
      })
    }
  })
})

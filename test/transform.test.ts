import { resolve } from 'path'
import { promises as fs } from 'fs'
import fg from 'fast-glob'
import { describe, expect, it } from 'vitest'
import { transform } from '../src'

describe('transform', () => {
  describe('fixtures', () => {
    const root = resolve(__dirname, '..')
    const files = fg.sync([
      'test/fixtures/*.{vue,js,ts}',
      'playground/src/*.{vue,js,ts}',
    ], {
      cwd: root,
      onlyFiles: true,
    })

    for (const file of files) {
      it(file.replace(/\\/g, '/'), async () => {
        const fixture = await fs.readFile(resolve(root, file), 'utf-8')
        const result = (await transform(fixture, file, { reactivityTransform: true }))?.code || fixture
        expect(result).toMatchSnapshot()

        const result2 = (await transform(result, file, { reactivityTransform: true }))?.code || result
        expect(result).toEqual(result2)
      })
    }
  })
})

import { resolve } from 'path'
import { promises as fs } from 'fs'
import fg from 'fast-glob'
import { transform } from '../src'

describe('transform', () => {
  describe('playground', () => {
    const root = resolve(__dirname, '../playground')
    const files = fg.sync('*.vue', {
      cwd: root,
      onlyFiles: true,
    })

    for (const file of files) {
      it(file, async() => {
        const fixture = await fs.readFile(resolve(root, file), 'utf-8')
        expect(transform(fixture, file).code).toMatchSnapshot()
      })
    }
  })

  describe('fixture', () => {
    const root = resolve(__dirname, 'fixtures')
    const files = fg.sync(['*.vue', '*.ts', '*.js'], {
      cwd: root,
      onlyFiles: true,
    })

    for (const file of files) {
      it(file, async() => {
        const fixture = await fs.readFile(resolve(root, file), 'utf-8')
        expect(transform(fixture, file, { refTransform: true }).code).toMatchSnapshot()
      })
    }
  })
})

import { Options } from 'tsup'

const options: Options = {
  format: [
    'cjs',
    'esm',
  ],
  clean: true,
  splitting: true,
  dts: true,
  entryPoints: [
    'src/*.ts',
  ],
}

export default options

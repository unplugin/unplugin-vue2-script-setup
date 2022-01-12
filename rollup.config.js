import ts from 'rollup-plugin-typescript2'
import dts from 'rollup-plugin-dts'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import alias from '@rollup/plugin-alias'

import pkg from './package.json'

const entries = [
  'src/index.ts',
  'src/webpack.ts',
  'src/vite.ts',
  'src/rollup.ts',
  'src/esbuild.ts',
  'src/nuxt.ts',
]

const dtsEntries = [
  ...entries,
  'src/types.ts',
]

const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
  '@babel/parser',
  'worker_threads',
  'vite',
  'webpack',
  '@nuxt/kit',
]



const defaults = {
  external,
  plugins: [
    alias({
      entries: [
        { find: /^node:(.+)$/, replacement: '$1' },
      ],
    }),
    resolve({
      preferBuiltins: true,
    }),
    json(),
    commonjs(),
    ts(),
  ],
  onwarn(message) {
    if (/Circular dependencies/.test(message))
      return
    console.error(message)
  },
}

export default [
  ...entries.map(input => ({
    input,
    output: [
      {
        file: input.replace('src/', 'dist/').replace('.ts', '.mjs'),
        format: 'esm',
        sourcemap: 'inline',
      },
      {
        file: input.replace('src/', 'dist/').replace('.ts', '.js'),
        format: 'cjs',
        sourcemap: 'inline',
        exports: 'named',
      },
    ],
    ...defaults,
  })),
  ...dtsEntries.map(input => ({
    input,
    output: {
      file: input.replace('src/', 'dist/').replace('.ts', '.d.ts'),
      format: 'esm',
    },
    external,
    plugins: [
      dts({ respectExternal: true }),
    ],
  })),
]

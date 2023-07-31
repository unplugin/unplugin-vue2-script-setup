// @ts-check
import * as fs from 'node:fs'
import ts from 'rollup-plugin-esbuild'
import dts from 'rollup-plugin-dts'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import alias from '@rollup/plugin-alias'

/** @type {import('./package.json')} */
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

const entries = {
  index: 'src/index.ts',
  webpack: 'src/webpack.ts',
  vite: 'src/vite.ts',
  rollup: 'src/rollup.ts',
  esbuild: 'src/esbuild.ts',
  nuxt: 'src/nuxt.ts',
  types: 'src/types.ts',
}

const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
  'esbuild',
  'rollup',
  'vite',
  'webpack',
  '@nuxt/kit',
]


/** @type {import('rollup').RollupOptions[]} */
export default [
  {
    input: entries,
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
    onwarn({ code, message }) {
      if(code === 'EMPTY_BUNDLE') return
      console.error(message)
    },
    output:[
      {
        dir: 'dist',
        format: 'esm',
        sourcemap: 'inline',
        entryFileNames: "[name].mjs",
      },
      {
        dir: 'dist',
        format: 'cjs',
        exports: 'named',
        sourcemap: 'inline',
        entryFileNames: "[name].js",
      },
    ]
  },
  {
    input: entries,
    external,
    plugins: [
      dts({ respectExternal: true }),
    ],
    output: [
      {
        dir: 'dist',
        entryFileNames: "[name].d.mts",
      },
      {
        dir: 'dist',
        entryFileNames: "[name].d.ts",
      },
    ],
  },
]

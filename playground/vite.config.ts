import { defineConfig } from 'vite'
import { createVuePlugin as Vue2 } from 'vite-plugin-vue2'
import Inspect from 'vite-plugin-inspect'
import { unplugin } from '../src'

const ScriptSetup = unplugin.vite

export default defineConfig({
  plugins: [
    Vue2(),
    Inspect(),
    ScriptSetup({
      refTransform: true,
    }),
  ],
})

import { defineConfig } from 'vite'
import { createVuePlugin as Vue2 } from 'vite-plugin-vue2'
import Inspect from 'vite-plugin-inspect'
import { transform } from '../src'

export default defineConfig({
  plugins: [
    Vue2(),
    Inspect(),
    {
      name: 'vue2-script-setup-transform',
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('.vue'))
          return transform(code)
      },
    },
  ],
})

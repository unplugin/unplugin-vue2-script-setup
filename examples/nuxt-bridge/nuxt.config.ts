import { defineNuxtConfig } from '@nuxt/bridge'

export default defineNuxtConfig({
  components: true,
  bridge: {
    meta: true,
    vite: true,
  },
})

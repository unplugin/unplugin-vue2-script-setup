/* eslint-disable @typescript-eslint/no-var-requires */

const { defineConfig } = require('@vue/cli-service')
const ScriptSetup = require('unplugin-vue2-script-setup/webpack').default

module.exports = defineConfig({
  configureWebpack: {
    plugins: [
      ScriptSetup({
        reactivityTransform: true,
      }),
    ],
  },
  parallel: false,
  chainWebpack(config) {
    // disable type check and let `vue-tsc` handles it
    config.plugins.delete('fork-ts-checker')

    // disable cache for testing, you should remove this in production
    config.module.rule('vue').uses.delete('cache-loader')
    config.module.rule('js').uses.delete('cache-loader')
    config.module.rule('ts').uses.delete('cache-loader')
    config.module.rule('tsx').uses.delete('cache-loader')
  },
})

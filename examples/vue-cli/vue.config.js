/* eslint-disable @typescript-eslint/no-var-requires */

const ScriptSetup = require('unplugin-vue2-script-setup/webpack')

/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = {
  configureWebpack: {
    plugins: [
      ScriptSetup(),
    ],
  },
  chainWebpack(config) {
    // disable type check and let `vue-tsc` handles it
    config.plugins.delete('fork-ts-checker')
  },
}

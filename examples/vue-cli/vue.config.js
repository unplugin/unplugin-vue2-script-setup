/* eslint-disable @typescript-eslint/no-var-requires */

const ScriptSetup = require('vue2-script-setup-transform/webpack-plugin').default

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

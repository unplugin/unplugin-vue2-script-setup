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
}

/* eslint-disable @typescript-eslint/no-var-requires */
const { transform } = require('./dist/index')

module.exports = {
  process(source, filename, ...args) {
    const transformed = transform(source, filename)
    const code = transformed ? transformed.code : source
    return require('vue-jest').process.call(this, code, filename, ...args)
  },
}

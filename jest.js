/* eslint-disable @typescript-eslint/no-var-requires */
const { transform } = require('./dist/index')

module.exports = {
  process(source, filename, ...args) {
    const transformed = transform(source, filename)
    return require('vue-jest').process.call(this, transformed.code, filename, ...args)
  },
}

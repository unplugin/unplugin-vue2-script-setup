/* eslint-disable @typescript-eslint/no-var-requires */
const { transform } = require('./dist/index')

function requireVueJest() {
  const names = ['@vue/vue2-jest', 'vue-jest']
  for (const name of names) {
    try {
      return require(name)
    }
    catch (e) {
      // Try next module
    }
  }
  throw new Error(`Cannot find a Jest transformer for Vue SFC, you should install one of these packages: ${names.join(', ')}`)
}

module.exports = {
  process(source, filename, ...args) {
    const transformed = transform(source, filename)
    const code = transformed ? transformed.code : source
    return requireVueJest().process.call(this, code, filename, ...args)
  },
}

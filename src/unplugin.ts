import { createUnplugin } from 'unplugin'
import { transform } from '.'

const scriptSetupRE = /<script\s+setup/

export default createUnplugin(() => ({
  name: 'vue2-script-setup-transform',
  enforce: 'pre',
  transformInclude(id) {
    return id.endsWith('.vue')
  },
  transform(code) {
    if (scriptSetupRE.test(code))
      return transform(code)
  },
}))

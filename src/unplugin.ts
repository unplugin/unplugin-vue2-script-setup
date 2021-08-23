import { createUnplugin } from 'unplugin'
import { ScriptSetupTransformOptions } from './types'
import { transform } from '.'

const scriptSetupRE = /<script\s+setup/

export default createUnplugin<ScriptSetupTransformOptions>(options => ({
  name: 'vue2-script-setup-transform',
  enforce: 'pre',
  transformInclude(id) {
    return id.endsWith('.vue')
  },
  transform(code, id) {
    try {
      if (scriptSetupRE.test(code))
        return transform(code, id, options)
    }
    catch (e) {
      this.error(e)
    }
  },
}))

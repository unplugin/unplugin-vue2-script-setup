import { createUnplugin } from 'unplugin'
import { ScriptSetupTransformOptions } from './types'
import { transform } from '.'

export * from './core/transform'
export * from './types'

const scriptSetupRE = /<script\s(.*\s)?setup(\s.*)?>/

export default createUnplugin<ScriptSetupTransformOptions>(options => ({
  name: 'unplugin-vue2-script-setup',
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

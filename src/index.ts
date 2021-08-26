import { createUnplugin } from 'unplugin'
import { ScriptSetupTransformOptions } from './types'
import { transform } from '.'

export * from './core/transform'
export * from './types'

const scriptSetupRE = /<script\s+setup/

export default createUnplugin<ScriptSetupTransformOptions>(options => ({
  name: 'unplugin-vue2-script-setup',
  enforce: 'pre',
  transformInclude(id) {
    const exts = ['.vue']
    if (options?.refTransform) exts.push('.ts', '.js')
    return exts.some(ext => id.endsWith(ext))
  },
  transform(code, id) {
    try {
      if (options?.refTransform || scriptSetupRE.test(code))
        return transform(code, id, options)
    }
    catch (e) {
      this.error(e)
    }
  },
}))

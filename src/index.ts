import { createUnplugin } from 'unplugin'
import { createFilter } from '@rollup/pluginutils'
import { PluginOptions } from './types'
import { transform } from './core'

export * from './core'

export default createUnplugin<PluginOptions>((options = {}) => {
  const filter = createFilter(
    options.include || (options.refTransform ? [/\.vue$/, /\.vue\?vue/, /\.[jt]sx?$/] : [/\.vue$/, /\.vue\?vue/]),
    options.exclude || [/node_modules/, /\.git/, /\.nuxt/],
  )

  return {
    name: 'unplugin-vue2-script-setup',
    enforce: 'pre',
    transformInclude(id) {
      return filter(id)
    },
    transform(code, id) {
      try {
        return transform(code, id, options)
      }
      catch (e: any) {
        this.error(e)
      }
    },
  }
})

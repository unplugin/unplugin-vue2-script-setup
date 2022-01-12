import * as defu from 'defu'
import type { PluginOptions } from './types'
import unplugin from '.'

function scriptSetupModule(this: any, inlineOptions: PluginOptions = {}) {
  // FIXME: defu cjs types should changed
  const options = (defu.default || defu)(inlineOptions, this.nuxt.options.scriptSetup)

  // install webpack plugin
  this.extendBuild((config: any) => {
    config.plugins = config.plugins || []
    config.plugins.unshift(unplugin.webpack(options))
  })

  // install vite plugin
  this.nuxt.hook('vite:extend', async(vite: any) => {
    vite.config.plugins = vite.config.plugins || []
    vite.config.plugins.push(unplugin.vite(options))
  })
}

export default scriptSetupModule

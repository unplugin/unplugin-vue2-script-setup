import defu from 'defu'
import type { PluginOptions } from './types'
import unplugin from '.'

export default function(this: any, inlineOptions: PluginOptions = {}) {
  const options = defu(inlineOptions, this.nuxt.options.scriptSetup)

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

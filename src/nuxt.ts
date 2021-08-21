import vitePlugin from './vite-plugin'
import webpackPlugin from './webpack-plugin'

export default function(this: any) {
  // install webpack plugin
  this.extendBuild((config: any) => {
    config.plugins = config.plugins || []
    config.plugins.unshift(webpackPlugin())
  })

  // install vite plugin
  this.nuxt.hook('vite:extend', async(vite: any) => {
    vite.config.plugins = vite.config.plugins || []
    vite.config.plugins.push(vitePlugin())
  })
}

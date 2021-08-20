import type { Plugin } from 'vite'
import { transform } from './transform'

const scriptSetupRE = /<script\s+setup/

export default () => {
  return <Plugin>{
    name: 'vue2-script-setup-transform',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('.vue') && scriptSetupRE.test(code))
        return transform(code)
    },
  }
}

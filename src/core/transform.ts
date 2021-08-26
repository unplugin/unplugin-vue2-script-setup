import MagicString from 'magic-string'
import { shouldTransform, transform as transformRef } from '@vue/ref-transform'
import { ScriptSetupTransformOptions } from '../types'
import { parseSFC } from './parseSFC'
import { transformScriptSetup } from './transformScriptSetup'
import { transformSFCRef } from './transformSFCRef'

const importHelpersFrom = '@vue/composition-api'

export function transform(input: string, id: string, options?: ScriptSetupTransformOptions) {
  let s = new MagicString(input)

  if (id.endsWith('.vue')) {
    let sfc = parseSFC(input, id)

    if (options?.refTransform && (sfc.script.found || sfc.scriptSetup.found)) {
      s = transformSFCRef(sfc, s, importHelpersFrom)
      sfc = parseSFC(s.toString(), id)
    }

    const { code } = transformScriptSetup(sfc, options)

    const attributes = {
      ...sfc.script.attrs,
      ...sfc.scriptSetup.attrs,
    }
    delete attributes.setup
    const attr = Object.entries(attributes)
      .map(([key, value]) => value ? `${key}="${value}"` : key)
      .join(' ')

    if (code) {
      const block = `<script ${attr}>\n${code}\n</script>`

      s.remove(sfc.script.start, sfc.script.end)
      if (sfc.scriptSetup.start !== sfc.scriptSetup.end) {
        s.overwrite(
          sfc.scriptSetup.start,
          sfc.scriptSetup.end,
          block,
        )
      }
      else {
        s.prependLeft(0, `${block}\n`)
      }
    }
  }
  else if (options?.refTransform && shouldTransform(input)) {
    const { code, map } = transformRef(input, {
      filename: id,
      sourceMap: true,
      importHelpersFrom,
    })
    return { code, map }
  }

  return {
    code: s.toString(),
    get map() { return s.generateMap() },
  }
}

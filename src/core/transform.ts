import MagicString from 'magic-string'
import { ScriptSetupTransformOptions } from '../types'
import { parseSFC } from './parseSFC'
import { transformScriptSetup } from './transformScriptSetup'

export function transform(input: string, id?: string, options?: ScriptSetupTransformOptions) {
  const s = new MagicString(input)
  const sfc = parseSFC(input, id)
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

  return {
    code: s.toString(),
    get map() { return s.generateMap() },
  }
}

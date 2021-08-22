import MagicString from 'magic-string'
import { parseVueSFC } from './parse'
import { transformScriptSetup } from './transformScriptSetup'

export function transform(sfc: string, id?: string) {
  const s = new MagicString(sfc)
  const result = parseVueSFC(sfc, id)
  const { code } = transformScriptSetup(result)

  const attributes = {
    ...result.script.attrs,
    ...result.scriptSetup.attrs,
  }
  delete attributes.setup
  const attr = Object.entries(attributes)
    .map(([key, value]) => value ? `${key}="${value}"` : key)
    .join(' ')

  if (code) {
    const block = `<script ${attr}>\n${code}\n</script>`

    s.remove(result.script.start, result.script.end)
    if (result.scriptSetup.start !== result.scriptSetup.end) {
      s.overwrite(
        result.scriptSetup.start,
        result.scriptSetup.end,
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

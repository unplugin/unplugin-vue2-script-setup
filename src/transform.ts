import MagicString from 'magic-string'
import { transformScriptSetup, parseVueSFC } from './parse'

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

  s.remove(result.script.start, result.script.end)
  s.overwrite(
    result.scriptSetup.start,
    result.scriptSetup.end,
    `<script ${attr}>\n${code}\n</script>`,
  )

  return {
    code: s.toString(),
    get map() { return s.generateMap() },
  }
}

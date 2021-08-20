import MagicString from 'magic-string'
import { transformScriptSetup, parseVueSFC } from './parse'

export function transform(sfc: string) {
  const s = new MagicString(sfc)
  const result = parseVueSFC(sfc)
  const { code } = transformScriptSetup(result)

  const attributes = {
    ...result.script.attributes,
    ...result.scriptSetup.attributes,
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

  return s.toString()
}

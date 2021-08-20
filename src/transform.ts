import MagicString from 'magic-string'
import { parseScriptSetup, parseVueSFC } from './parse'

export function transform(sfc: string) {
  const s = new MagicString(sfc)
  const result = parseVueSFC(sfc)
  const script = parseScriptSetup(result)

  const full = [
    '',
    ...script.imports,
    'const __sfc_main = {}',
    `__sfc_main.setup = ${script.fn}`,
    'export default __sfc_main',
    '',
  ].join('\n')

  s.overwrite(
    result.scriptSetup.contentStart,
    result.scriptSetup.contentEnd,
    full,
  )

  return s.toString()
}

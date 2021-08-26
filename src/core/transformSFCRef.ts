import { shouldTransform, transformAST } from '@vue/ref-transform'
import MagicString from 'magic-string'
import { ParsedSFC } from '../types'

export function transformSFCRef(sfc: ParsedSFC, s: MagicString, importHelpersFrom: string) {
  const importedHelpers = new Set<string>()
  for (const script of [sfc.script, sfc.scriptSetup]) {
    if (shouldTransform(script.content)) {
      const transformed = new MagicString(script.content)
      const { importedHelpers: helpers } = transformAST(script.ast, transformed)
      helpers.forEach(helper => importedHelpers.add(helper))
      s.overwrite(script.contentStart, script.contentEnd, transformed.toString())
    }
  }

  if (importedHelpers.size) {
    s.prependRight((sfc.scriptSetup.found ? sfc.scriptSetup : sfc.script).contentStart,
      `\nimport { ${Array.from(importedHelpers)
        .map(h => `${h} as _${h}`)
        .join(', ')} } from '${importHelpersFrom}'\n`,
    )
  }

  return new MagicString(s.toString())
}

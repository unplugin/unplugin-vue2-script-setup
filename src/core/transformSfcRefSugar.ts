import { shouldTransform, transformAST } from '@vue/ref-transform'
import MagicString from 'magic-string'
import { parse } from '@babel/parser'
import { types as t } from '@babel/core'
import type { ParsedSFC, ResolvedOptions } from '../types'

export function transformSfcRefSugar(sfc: ParsedSFC, options: ResolvedOptions) {
  const importedHelpers = new Set<string>()

  for (const script of [sfc.script, sfc.scriptSetup]) {
    if (shouldTransform(script.content)) {
      const s = new MagicString(script.content)
      const { importedHelpers: imports } = transformAST(script.ast, s)
      Array.from(imports).forEach(helper => importedHelpers.add(helper))
      script.content = s.toString()
      script.ast = parse(script.content, sfc.parserOptions).program
    }
  }

  if (importedHelpers.size) {
    sfc.extraDeclarations = [
      t.importDeclaration(
        Array.from(importedHelpers).map(i => t.importSpecifier(t.identifier(`_${i}`), t.identifier(i))),
        t.stringLiteral(options.importHelpersFrom),
      ),
    ]
  }
}

import MagicString from 'magic-string'
import { shouldTransform as shouldTransformRefSugar, transform as transformRef } from '@vue/ref-transform'
import { ScriptSetupTransformOptions, TransformResult } from '../types'
import { parseSFC } from './parseSFC'
import { transformScriptSetup } from './transformScriptSetup'
import { transformSfcRefSugar } from './transformSfcRefSugar'

export const importHelpersFrom = '@vue/composition-api'
const scriptSetupRE = /<script\s(.*\s)?setup(\s.*)?>/

export function shouldTransform(code: string, id: string, options?: ScriptSetupTransformOptions): boolean {
  if (options?.refTransform)
    return true
  return scriptSetupRE.test(code)
}

export function transform(input: string, id: string, options?: ScriptSetupTransformOptions): TransformResult {
  if (!id.endsWith('.vue'))
    return transformNonVue(input, id, options)
  else
    return transformVue(input, id, options)
}

export function transformNonVue(input: string, id: string, options: ScriptSetupTransformOptions | undefined): TransformResult {
  if (options?.refTransform && shouldTransformRefSugar(input)) {
    return transformRef(input, {
      filename: id,
      sourceMap: true,
      importHelpersFrom,
    })
  }
  return null
}

export function transformVue(input: string, id: string, options: ScriptSetupTransformOptions | undefined): TransformResult {
  const s = new MagicString(input)

  const sfc = parseSFC(input, id)

  if (options?.refTransform)
    transformSfcRefSugar(sfc)

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

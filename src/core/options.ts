import { ScriptSetupTransformOptions, ResolvedOptions } from '../types'

export function resolveOptions(options: ScriptSetupTransformOptions = {}): ResolvedOptions {
  return Object.assign(
    {},
    {
      sourceMap: true,
      refTransform: false,
      importHelpersFrom: '@vue/composition-api',
      astTransforms: {},
    },
    options,
  )
}

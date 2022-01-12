import type { ResolvedOptions, ScriptSetupTransformOptions } from '../types'

export function resolveOptions(options: ScriptSetupTransformOptions = {}): ResolvedOptions {
  return Object.assign(
    {},
    {
      sourceMap: true,
      reactivityTransform: false,
      importHelpersFrom: '@vue/composition-api',
      astTransforms: {},
    },
    options,
  )
}

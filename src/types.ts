import type { Program } from '@babel/types'
import type { FilterPattern } from '@rollup/pluginutils'

export interface ScriptTagMeta {
  start: number
  end: number
  contentStart: number
  contentEnd: number
  content: string
  attrs: Record<string, string>
  found: boolean
  ast: Program
}

export interface ParsedSFC {
  id?: string
  template: {
    components: Set<string>
    identifiers: Set<string>
  }
  scriptSetup: ScriptTagMeta
  script: ScriptTagMeta
}

export interface ScriptSetupTransformOptions {
  astTransforms?: {
    script?: (ast: Program) => Program
    scriptSetup?: (ast: Program) => Program
    post?: (ast: Program, sfc: ParsedSFC) => Program
  }
  refTransform?: boolean
}

export interface PluginOptions extends ScriptSetupTransformOptions {
  include?: FilterPattern
  exclude?: FilterPattern
}

export type TransformResult = {
  code: string
  readonly map: any
} | null

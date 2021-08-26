import type { ParserOptions } from '@babel/parser'
import type { Program, Node } from '@babel/types'
import type { FilterPattern } from '@rollup/pluginutils'
import type { SourceMap } from 'rollup'

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
  parserOptions: ParserOptions
  extraDeclarations: Node[]
}

export interface ScriptSetupTransformOptions {
  astTransforms?: {
    script?: (ast: Program) => Program
    scriptSetup?: (ast: Program) => Program
    post?: (ast: Program, sfc: ParsedSFC) => Program
  }
  refTransform?: boolean
  importHelpersFrom?: string
  sourceMap?: boolean
}

export interface PluginOptions extends ScriptSetupTransformOptions {
  include?: FilterPattern
  exclude?: FilterPattern
}

export type ResolvedOptions = Required<ScriptSetupTransformOptions>

export type TransformResult = {
  code: string
  readonly map: SourceMap | null
} | null

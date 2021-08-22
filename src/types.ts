import { Program } from '@babel/types'

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
}

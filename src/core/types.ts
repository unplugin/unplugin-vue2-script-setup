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

export interface PropTypeData {
  key: string
  type: string[]
  required: boolean
}

export interface ScriptSetupTransformOptions {

}

export interface ScriptSetupTransformContext {

}

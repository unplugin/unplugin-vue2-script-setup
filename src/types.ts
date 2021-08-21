export interface TagMeta {
  start: number
  end: number
  contentStart: number
  contentEnd: number
  content: string
  attrs: Record<string, string>
  found: boolean
}

export interface ParseResult {
  id?: string
  template: {
    components: Set<string>
    identifiers: Set<string>
  }
  scriptSetup: TagMeta
  script: TagMeta
}

export interface PropTypeData {
  key: string
  type: string[]
  required: boolean
}

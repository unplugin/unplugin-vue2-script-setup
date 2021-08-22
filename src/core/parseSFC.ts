import { Parser as HTMLParser } from 'htmlparser2'
import { parse, ParserOptions } from '@babel/parser'
import { camelize, capitalize, isHTMLTag, isSVGTag, isVoidTag } from '@vue/shared'
import { ParsedSFC, ScriptTagMeta } from './types'
import { getIdentifierUsages } from './identifiers'

export function parseSFC(code: string, id?: string): ParsedSFC {
  const components = new Set<string>()
  const expressions = new Set<string>()
  const identifiers = new Set<string>()

  let templateLevel = 0
  let inScriptSetup = false
  let inScript = false

  const scriptSetup: ScriptTagMeta = {
    start: 0,
    end: 0,
    contentStart: 0,
    contentEnd: 0,
    content: '',
    attrs: {},
    found: false,
    ast: undefined!,
  }
  const script: ScriptTagMeta = {
    start: 0,
    end: 0,
    contentStart: 0,
    contentEnd: 0,
    content: '',
    attrs: {},
    found: false,
    ast: undefined!,
  }

  const parser = new HTMLParser({
    onopentag(name, attributes) {
      if (!name)
        return

      if (name === 'template')
        templateLevel += 1

      if (templateLevel > 0) {
        if (!isHTMLTag(name) && !isSVGTag(name) && !isVoidTag(name))
          components.add(capitalize(camelize(name)))
        Object.entries(attributes).forEach(([key, value]) => {
          if (!value)
            return
          if (key.startsWith('v-') || key.startsWith('@') || key.startsWith(':')) {
            if (key === 'v-for')
              // we strip out delectations for v-for before `in` or `of`
              expressions.add(`(${value.replace(/^.*?\w(?:in|of)\w/, '')})`)
            else
              expressions.add(`(${value})`)
          }
          if (key === 'ref')
            identifiers.add(value)
        })
      }
      else {
        if (name === 'script') {
          if ('setup' in attributes) {
            scriptSetup.start = parser.startIndex
            scriptSetup.contentStart = parser.endIndex! + 1
            scriptSetup.attrs = attributes
            scriptSetup.found = true
            inScriptSetup = true
          }
          else {
            script.start = parser.startIndex
            script.contentStart = parser.endIndex! + 1
            script.attrs = attributes
            script.found = true
            inScript = true
          }
        }
      }
    },
    ontext(text) {
      if (templateLevel > 0) {
        Array.from(text.matchAll(/\{\{(.*?)\}\}/g)).forEach(([, expression]) => {
          expressions.add(`(${expression})`)
        })
      }
    },
    onclosetag(name) {
      if (name === 'template')
        templateLevel -= 1

      if (inScriptSetup && name === 'script') {
        scriptSetup.end = parser.endIndex! + 1
        scriptSetup.contentEnd = parser.startIndex
        scriptSetup.content = code.slice(scriptSetup.contentStart, scriptSetup.contentEnd)
        inScriptSetup = false
      }
      if (inScript && name === 'script') {
        script.end = parser.endIndex! + 1
        script.contentEnd = parser.startIndex
        script.content = code.slice(script.contentStart, script.contentEnd)
        inScript = false
      }
    },
  }, {
    xmlMode: true,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
    recognizeSelfClosing: true,
  })

  parser.write(code)
  parser.end()

  expressions.forEach((exp) => {
    const nodes = parse(exp).program.body
    nodes.forEach(node => getIdentifierUsages(node, identifiers))
  })

  if (script.found && scriptSetup.found && scriptSetup.attrs.lang !== script.attrs.lang)
    throw new SyntaxError('<script setup> language must be the same as <script>')

  const parserOptions: ParserOptions = {
    sourceType: 'module',
    plugins: [],
  }

  const lang = scriptSetup.attrs.lang || script.attrs.lang || 'js'
  if (lang === 'ts')
    parserOptions.plugins!.push('typescript')
  else if (lang === 'jsx')
    parserOptions.plugins!.push('jsx')
  else if (lang === 'tsx')
    parserOptions.plugins!.push('typescript', 'jsx')
  else if (lang !== 'js')
    throw new SyntaxError(`Unsupported script language: ${lang}`)

  scriptSetup.ast = parse(scriptSetup.content, parserOptions).program
  script.ast = parse(script.content || '', parserOptions).program

  return {
    id,
    template: {
      components,
      identifiers,
    },
    scriptSetup,
    script,
  }
}

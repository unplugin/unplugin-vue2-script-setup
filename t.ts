import fs from 'fs'
import { resolve } from 'path'
import { parseScriptSetup, parseVueSFC, transform } from './src'

const fixture = fs.readFileSync(resolve(__dirname, 'test/fixtures/Fixture1.vue'), 'utf-8')

const result = parseVueSFC(fixture)
console.log(result)
// console.log(parseScriptSetup(result))

console.log(transform(fixture))

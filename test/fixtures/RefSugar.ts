/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable prefer-const */
import { ref } from '@vue/composition-api'

let ref1 = $(ref('hello'))
ref1 = 'world'
let ref1Raw = $$(ref1)

let ref2 = $ref('hello')
ref2 = 'world'
let ref2Raw = $$(ref2)

let computed1 = $computed(() => ref2 += ' str')
let computed1Raw = $$(computed1)

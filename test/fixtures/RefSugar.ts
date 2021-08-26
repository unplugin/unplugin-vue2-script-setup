let ref1 = $(ref('hello'))
ref1 = 'world'
const ref1Raw = $$(ref1)

let ref2 = $ref('hello')
ref2 = 'world'
const ref2Raw = $$(ref2)

let computed1 = $computed(() => ref2 += ' str')
const computed1Raw = $$(computed1)

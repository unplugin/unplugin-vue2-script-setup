<script lang="ts">
/* eslint-disable import/first */
export default {
  name: 'App',
}
</script>
<script setup lang="ts">
import { watch } from '@vue/composition-api'
import Foo from './Foo.vue'
import Bar from './Bar.vue'

withDefaults(defineProps<{ msg: string; name: string | number }>(), { msg: 'Hello' })
const emit = defineEmits<{
  (event: 'update', value: number): void
}>()

let count = $ref(0)
// eslint-disable-next-line prefer-const
let doubled = $computed(() => count * 2)

function inc() {
  count += 1
}
function dec() {
  count -= 1
}

const decText = '<b>Dec</b>'

watch(count, value => emit('update', value))
</script>
<template>
  <div>
    <h3>{{ msg }}, {{ name }}</h3>
    <button @click="inc">
      Inc
    </button>
    <div>{{ count }} x 2 = {{ doubled }}</div>
    <button @click="dec()" v-html="decText" />
    <component :is="count > 2 ? Foo : Bar" />
  </div>
</template>

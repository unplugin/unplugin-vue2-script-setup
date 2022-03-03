<script setup lang="ts">
/* eslint-disable no-console */
import { reactive } from '@vue/composition-api'
const state = reactive({ value: '' })
function showEvent(event: MouseEvent) {
  console.log(event)
}
const emit = defineEmits<{
  (event: 'foo'): void
}>()
</script>
<template>
  <div
    @click="
      state.value = `x: ${$event.x}`
      showEvent($event)
      emit('foo')
    "
  >
    2333
  </div>
</template>

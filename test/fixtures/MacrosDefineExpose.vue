<template>
  <div>{{ a }}</div>
  <div>{{ text?.length ?? textLengthDefault }}</div>
</template>

<script setup lang="ts">
import { ref } from '@vue/composition-api'

const a = ref(1)
const b = 1
const text = 'hello'
const textLengthDefault = 0
defineExpose({ b })
</script>

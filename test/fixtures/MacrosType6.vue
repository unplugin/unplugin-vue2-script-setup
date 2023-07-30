<script setup lang="ts">
const slots = defineSlots<{
  default: { msg: string }
}>()
</script>
<template>
  <template v-if="slots.default">
    <slot name="default" msg="hello"></slot>
  </template>
  <div v-else>
    fallback
  </div>
</template>

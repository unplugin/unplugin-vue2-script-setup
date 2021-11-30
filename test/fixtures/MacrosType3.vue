<template>
  <div @click="emit('update', msg);emit('update', msg + value);">
    {{ msg }}
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ msg: string; value: number | string; data?: { value: boolean } }>(),
  { msg: 'Hello' },
)

const emit = defineEmits(['update'])
const value = 'bar'
</script>

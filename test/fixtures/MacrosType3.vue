<template>
  <div @click="emit('update', msg)">
    {{ msg }}
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ msg: string; value: number | string; data?: { value: boolean } }>(),
  { msg: 'Hello' },
)

const emit = defineEmits(['update'])
</script>

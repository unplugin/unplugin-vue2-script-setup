<template>
  <div @click="emit('update', props.msg)">
    {{ msg }}
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{ msg: string; value: number | string; data?: { value: boolean } }>(),
  { msg: 'Hello' },
)

const emit = defineEmits(['update'])
</script>

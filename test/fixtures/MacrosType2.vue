<template>
  <div @click="emit(props.msg)">
    {{ msg }}
  </div>
</template>

<script setup lang="ts">
export interface Props {
  msg: string
  value: number | string
  data?: { value: boolean }
  arr?: [number, string, {}]
  any: any
}

const props = withDefaults(
  defineProps<Props>(),
  { msg: 'Hello' },
)

const emit = defineEmits<{
  (msg: string): void
  (msg: number): number
}>()
</script>

<template>
  <div @click="emit(props.msg)">{{ msg }}</div>
</template>

<script setup>
const props = defineProps({
  msg: String,
})

const emit = defineEmits()
</script>

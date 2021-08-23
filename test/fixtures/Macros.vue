<template>
  <div @click="emit(props.msg)">{{ msg }}</div>
</template>

<script setup lang="js">
const props = defineProps({
  msg: String,
})

const emit = defineEmits(['msg', 'update'])
</script>

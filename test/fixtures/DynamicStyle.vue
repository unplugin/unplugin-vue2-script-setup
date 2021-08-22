<template>
  <div :style="{ color, border: '1px' }" />
</template>

<script setup lang="ts">
const color = computed(() => 'red')
</script>

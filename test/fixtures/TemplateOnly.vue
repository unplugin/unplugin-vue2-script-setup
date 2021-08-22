<template>
  <div>
    <div v-for="(item, index) in items" :key="item">
      {{ index }}: {{ item }}
    </div>
  </div>
</template>

<script setup lang="ts">
const items = [
  { name: 'Item 1', value: 1 },
  { name: 'Item 2', value: 2 },
  { name: 'Item 3', value: 3 },
  { name: 'Item 4', value: 4 },
]
</script>

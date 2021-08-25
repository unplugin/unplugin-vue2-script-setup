<template>
  <div>
    <div v-for="(item, index) in items" :key="item">
      {{ item }}
    </div>
    <div v-for="{ cargo_key, in_of } in items2">
      {{ cargo_key }}
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

const items2 = [
  { cargo_key: 'cargo_key', in_of: 'in' },
]

const index = 0
</script>

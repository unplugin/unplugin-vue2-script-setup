<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <div>
    <Nuxt />
    <hr>
    Route: {{ route.path }}
  </div>
</template>

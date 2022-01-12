<template>
  <div>
    <Nuxt />
    <hr>
    Route: {{ route.path }}
  </div>
</template>

<script script>
const route = useRoute()
</script>

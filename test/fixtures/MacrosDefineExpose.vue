<template>
  <div>{{a}}</div>
</template>

<script setup lang="js">
const a = ref(1);
const b = 1;
defineExpose({b});
</script>

<template lang="pug">
.root
  span {{ data }} {{ title }}
  .p-1(@click="foo")
</template>

<script setup lang="ts">
const data = {
  title: 'Template Only',
}

function foo() {}
</script>

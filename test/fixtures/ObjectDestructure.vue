<template>
  <div></div>
</template>

<script setup>
import { toRefs, reactive } from 'vue'
const state = reactive({ data: 'hello' })
const { data } = toRefs(state)
</script>

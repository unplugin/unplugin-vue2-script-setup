<script setup lang="ts">
import { defineAsyncComponent } from '@vue/composition-api'
const ScriptOnly = defineAsyncComponent(() => import('./ScriptOnly.vue'))
</script>

<template>
  <ScriptOnly />
</template>

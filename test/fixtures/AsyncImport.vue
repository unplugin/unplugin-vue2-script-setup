<script setup lang="ts">
import { defineAsyncComponent } from 'script-setup'
const ScriptOnly = defineAsyncComponent(() => import('./ScriptOnly.vue'))
</script>

<template>
  <ScriptOnly />
</template>

<script lang="ts">
import type { ObjectDirective } from '@vue/composition-api'
// enables v-focus in templates
const vFocus: ObjectDirective<HTMLInputElement, null> = {
  inserted: (el, binding, vnode, oldVnode) => {
    el.focus()
  },
}
</script>
<script setup lang="ts"></script>
<template>
  <input v-focus="null">
</template>

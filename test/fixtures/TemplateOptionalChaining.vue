<template>
  <div @click="callback?.()">
    {{ text?.length ?? textLengthDefault }}
    {{ classes?.[0] }}
  </div>
</template>

<script setup lang="ts">
const text = 'hello'
const textLengthDefault = 0

const callback = undefined as undefined | (() => void)
const classes = undefined as undefined | string[]
</script>

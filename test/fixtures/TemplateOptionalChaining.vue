<template>
  <div @click="callback?.()">
    {{ text?.length ?? textLengthDefault?.[index] }}
    {{ classes?.[0] }}
    {{ arrayObj.data.value[i] }}
  </div>
</template>

<script setup lang="ts">
import { ref } from '@vue/composition-api'
const text = 'hello'
const textLengthDefault = ''
const index = ref(0)

const callback = undefined as undefined | (() => void)
const classes = undefined as undefined | string[]
const arrayObj = { data: { value: [1, 2, 3] } }
const i = 0
</script>

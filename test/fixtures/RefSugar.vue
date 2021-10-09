<template>
  <div>
    {{ msg }}
    {{ msg2 }}
    {{ a }}
  </div>
</template>

<script lang="ts">
/* eslint-disable prefer-const */
import { defineComponent, ref } from '@vue/composition-api'

export default defineComponent({
  setup() {
    let msg = $(ref('hello world'))

    return {
      msg,
      msgRef: $$(msg),
    }
  },
})
</script>

<script setup lang="ts">
let msg2 = $ref('hello world')

let a: number

a = 2
</script>

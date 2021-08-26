<template>
  <div>
    {{ msg }}
    {{ msg2 }}
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
    }
  },
})
</script>

<script setup lang="ts">
let msg2 = $ref('hello world')
</script>

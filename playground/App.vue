<template>
  <div>
    <button @click="inc">
      Inc
    </button>
    <div>{{ count }} x 2 = {{ doubled }}</div>
    <button @click="dec()" v-html="decText" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from '@vue/composition-api'

const count = ref(0)
const doubled = computed(() => count.value * 2)

function inc() {
  count.value += 1
}

function dec() {
  count.value += 1
}

const decText = '<b>Dec</b>'
</script>

<script lang="ts">
export default {
  name: 'App'
}
</script>

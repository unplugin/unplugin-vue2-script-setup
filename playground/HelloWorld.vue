<template>
  <div>
    <h3>{{ msg }}, {{ name }}</h3>
    <button @click="inc">
      Inc
    </button>
    <div>{{ count }} x 2 = {{ doubled }}</div>
    <button @click="dec()" v-html="decText" />
    <component :is="count > 2 ? Foo : Bar" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from '@vue/composition-api'
import Foo from './Foo.vue'
import Bar from './Bar.vue'

const props = withDefaults(defineProps<{ msg: string; name: string | number }>(), { msg: 'Hello' })
const emit = defineEmits(['update'])

const count = ref(0)
const doubled = computed(() => count.value * 2)

function inc() {
  count.value += 1
}

function dec() {
  count.value -= 1
}

const decText = '<b>Dec</b>'

watch(count, value => emit('update', value))
</script>

<script lang="ts">
export default {
  name: 'App'
}
</script>

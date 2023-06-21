<script setup lang="ts">
import Enum from './Enum.vue'
import { ref } from '@vue/composition-api';

let p = "hello word";
let Div = ref("hello word");
let h3 = 'test'
let H3 = ''
</script>

<template>
  <div>
    <Enum />
    <h3></h3>
    {{ H3 }}
    {{ h3 }}
    {{ Div }}
    <p>{{ p }}</p>
  </div>
</template>

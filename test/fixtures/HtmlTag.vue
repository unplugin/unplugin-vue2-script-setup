<script setup lang="ts">
import Enum from './Enum.vue';
import { ref } from '@vue/composition-api';
let p = "hello word";
let div = ref("hello word");
</script>

<template>
  <div>
    <Enum/>
    <p>{{ p }}</p>
  </div>
</template>

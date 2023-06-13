<script setup lang="ts">
import Button from './DynamicStyle.vue';
import button from './DynamicStyle.vue';
import { defineAsyncComponent } from '@vue/composition-api'
const footer = defineAsyncComponent(() => import('./ScriptOnly.vue'))

import { ref } from '@vue/composition-api';

const p =ref("hello word") ;

</script>

<template>
  <div>
    <p>{{ p }}</p>
    <button>{{ Button }}</button>
    <Button>{{ button }}</Button>
    <footer>FOOTER</footer>
  </div>
</template>

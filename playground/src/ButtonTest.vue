<script setup lang="ts">
import Button from './Foo.vue';
import button from './Foo.vue';
</script>

<template>
  <div>
    <button>{{ Button }}</button>
    <Button>{{ button }}</Button>
  </div>
</template>

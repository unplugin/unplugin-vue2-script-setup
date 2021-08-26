<template>
  <div>
    {{ msg }}
  </div>
</template>

<script setup lang="ts">
/* eslint-disable prefer-const */

let msg = $ref('hello world')
</script>

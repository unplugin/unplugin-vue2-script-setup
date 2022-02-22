<script lang="tsx">
const HelloComponent = ({ name }: { name: string }) => <span>Hello, {name}</span>
</script>
<script setup lang="tsx"></script>
<template>
  <HelloComponent name="Evan You" />
</template>

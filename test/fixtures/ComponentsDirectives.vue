<template>
  <div>
    <FooView ref="fooView" v-foo-bar="a" v-demo:foo.a.b="message"></FooView>
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
import { ref } from '@vue/runtime-dom'
import FooView from './FooView.vue'
import { vFooBar, vDemo } from './directive'

const fooView = ref<null | InstanceType<typeof FooView>>(null)
const a = ref(1)
const message = ref('hello')
</script>

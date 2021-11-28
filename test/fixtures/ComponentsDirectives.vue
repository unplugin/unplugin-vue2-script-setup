<template>
  <div>
    <FooView
      ref="fooView"
      v-foo-bar="message0"
      v-d0-demo:foo.a.b="message1"
      v-d1-modifiers.a="message2"
      v-d2-modifiers-no-value.b.c
      v-d3-arg:click="message3"
      v-d4-arg-no-value:click
      v-d5-arg-dynamic:[direction1+direction2.length].c="message4"
      v-d6-arg-dynamic-no-value:[direction3]
      v-d6-arg-dynamic-no-value:shouldNotUsed
    ></FooView>
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
import { ref } from '@vue/runtime-dom'
import FooView from './FooView.vue'
import { vFooBar, vDemo as vD0Demo, vD1Modifiers, vD2ModifiersNoValue, vD3Arg, vD4ArgNoValue, vD5ArgDynamic, vD6ArgDynamicNoValue } from './directive'

const fooView = ref<null | InstanceType<typeof FooView>>(null)
const message0 = ref('hello')
const message1 = ref('hello')
const message2 = ref('hello')
const message3 = ref('hello')
const message4 = ref('hello')
const direction1 = ref('top')
const direction2 = ref('top')
const direction3 = ref('top')
const shouldNotUsed = ref('')
</script>

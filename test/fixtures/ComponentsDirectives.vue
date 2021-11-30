<template>
  <div>
    <FooView
      v-if="now > 0"
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
    <button v-else-if="now === 0" :[propNamePrefix+propName]="1" @[eventPrefix.value+eventName]="console.log($event)"></button>
    <router-view v-else></router-view>
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

const propNamePrefix = 'vue-'
const propName = 'color'
const eventPrefix = { value: 'vue-' }
const eventName = ''

const console = globalThis.console
const now = Date.now()
</script>

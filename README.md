# vue2-script-setup-transform

[![NPM version](https://img.shields.io/npm/v/vue2-script-setup-transform?color=a1b858&label=)](https://www.npmjs.com/package/vue2-script-setup-transform)

Bring `<script setup>` to Vue 2.

## Install

```bash
npm i -D vue2-script-setup-transform
npm i @vue/composition-api
```

Install `@vue/composition-api` in your App's entry:

```ts
import Vue from 'vue'
import VueComposisionAPI from '@vue/composition-api'

Vue.use(VueComposisionAPI)
```

###### Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { createVuePlugin as Vue2 } from 'vite-plugin-vue2'
import ScriptSetup from 'vue2-script-setup-transform/vite-plugin'

export default defineConfig({
  plugins: [
    Vue2(),
    ScriptSetup(),
  ],
})
```

###### Webpack

```ts
// webpack.config.js
import ScriptSetup from 'vue2-script-setup-transform/webpack-plugin'

module.exports = {
  /* ... */
  plugins: [
    ScriptSetup()
  ]
}
```

###### JavaScript API

```ts
import { transform } from 'vue2-script-setup-transform'

const Vue2SFC = transform(`
<template>
  <!-- ... -->
</template>

<script setup>
  // ...
</script>
`)
```

## Status

- [x] POC
- [x] Components registration
- [x] Compile time macros `defineProps` `defineEmits` `withDefaults`
- [x] Merge with normal scripts
- [x] Vite plugin
- [x] Webpack plugin
- [x] Global types
- [ ] Top-level await

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2021 [Anthony Fu](https://github.com/antfu)

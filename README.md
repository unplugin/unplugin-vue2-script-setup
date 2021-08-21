# vue2-script-setup-transform

[![NPM version](https://img.shields.io/npm/v/vue2-script-setup-transform?color=a1b858&label=)](https://www.npmjs.com/package/vue2-script-setup-transform)

Bring [`<script setup>`](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0040-script-setup.md) to Vue 2.

## Install

```bash
npm i -D vue2-script-setup-transform
npm i @vue/composition-api
```

Install [`@vue/composition-api`](https://github.com/vuejs/composition-api) in your App's entry (this enables the `setup()` hook).

```ts
import Vue from 'vue'
import VueCompositionAPI from '@vue/composition-api'

Vue.use(VueCompositionAPI)
```

-------

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

Example: [`playground/`](./playground/)

-------

###### Nuxt

```bash
npm i @nuxtjs/composition-api
```

```ts
// nuxt.config.js
export default {
  buildModules: [
    '@nuxtjs/composition-api/module',
    'vue2-script-setup-transform/nuxt',
  ],
}
```

Example: [`examples/nuxt`](./examples/nuxt)

-------

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

-------

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

## IDE

We recommend using [VS Code](https://code.visualstudio.com/) with [Volar](https://github.com/johnsoncodehk/volar) to get the best experience (You might want to disable Vetur if you have it).

When using Volar, you will need to install `@vue/runtime-dom` as devDependencies to make it work on Vue 2.

```bash
npm i -D @vue/runtime-dom
```

[Learn more](https://github.com/johnsoncodehk/volar#using)

###### ESLint

If you are using ESLint, you might get `@typescript-eslint/no-unused-vars` warning with `<script setup>`. You can disable it and add `noUnusedLocals: true` in your `tsconfig.json`, Volar will infer the real missing locals correctly for you. 

## Status

- [x] PoC
- [x] Components registration
- [x] Compile time macros `defineProps` `defineEmits` `withDefaults`
- [x] Global types
- [x] Merge with normal scripts
- [x] Vite plugin
- [x] Webpack plugin
- [x] Nuxt module
- [ ] Top-level await

## How?

<details>
  <summary>
    👀
  </summary>

![image](https://user-images.githubusercontent.com/11247099/130307245-20f9342e-377b-4565-b55d-1b91741b5c0f.png)

It's made possible by transforming the SFC back to normal `<script>` and let the Vue 2 SFC compiler handle the rest.

</details>

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2021 [Anthony Fu](https://github.com/antfu)

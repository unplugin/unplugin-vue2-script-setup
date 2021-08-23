export default {
  buildModules: [
    // we disable the type check and left it to `vue-tsc`
    ['@nuxt/typescript-build', { typeCheck: false }],
    // @vue/composition-api support
    '@nuxtjs/composition-api/module',
    // install the transformer
    'vue2-script-setup-transform/nuxt',
  ],
}

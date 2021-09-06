export default {
  buildModules: [
    // we disable the type check and left it to `vue-tsc`
    ['@nuxt/typescript-build', { typeCheck: false }],
    // @vue/composition-api support,
    // which ships the `<script setup>` transformer out-of-box
    '@nuxtjs/composition-api/module',
  ],
}

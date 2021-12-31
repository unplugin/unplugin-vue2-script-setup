import Vue from 'vue'
import VueCompostionAPI, { createApp, h } from '@vue/composition-api'
import App from './App.vue'

Vue.config.productionTip = false
Vue.use(VueCompostionAPI)

const app = createApp({
  render: () => h(App),
})

app.mount('#app')

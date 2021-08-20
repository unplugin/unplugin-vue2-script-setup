import Vue from 'vue'
import VueComposisionAPI from '@vue/composition-api'
import App from './App.vue'

Vue.use(VueComposisionAPI)

const app = new Vue({
  render: h => h(App),
})
app.$mount('#app')

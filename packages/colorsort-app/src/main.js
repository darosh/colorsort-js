import 'vuetify/styles'

import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createVuetify } from 'vuetify'
// import ChartsVue from '@carbon/charts-vue'

import '@carbon/charts-vue/styles.css'

import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import App from './XApp.vue'
import XHome from '@/XHome.vue'

const vuetify = createVuetify({
  components,
  directives
})

const routes = [
  { path: '/', component: XHome },
  { path: '/stats', component: XHome },
  { path: '/edit', component: XHome },
  { path: '/test', component: XHome }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  stringifyQuery(query) {
    return Object.entries(query)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
  }
})

createApp(App)
  .use(router)
  .use(vuetify)
  // .use(ChartsVue)
  .mount('#app')

import 'vuetify/styles'

import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import App from './XApp.vue'
import XHome from '@/XHome.vue'

const vuetify = createVuetify({
  components,
  directives
})

const routes = [{ path: '/', component: XHome }]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

createApp(App).use(router).use(vuetify).mount('#app')

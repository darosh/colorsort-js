import 'vuetify/styles'

import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import App from './XApp.vue'

const vuetify = createVuetify({
  components,
  directives
})
createApp(App).use(vuetify).mount('#app')

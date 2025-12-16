import App from './App'
import config from '@/config/config.js'
import VueCompositionAPI from '@vue/composition-api'

import sql from '@/utils/sqlPlugin.js';
Vue.use(VueCompositionAPI)
Vue.prototype.$sql = sql;
Vue.prototype.$config = config  // 全局挂载
import rest from '@/request/api/api.js'
Vue.prototype.$rest = rest 
import logger from '@/utils/log.js'; // 提前引入，立即重写 console.log
import { TextEncoder, TextDecoder } from 'text-decoding'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder


import {TaskSteps} from '@/store/taskSteps.js' 
Vue.prototype.$task = TaskSteps;
Vue.prototype.$logger = logger;
// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif
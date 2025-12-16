// src/plugins/rest-plugin.js
import rest from '@/request/api/api';

export default {
  install(Vue) {
    Vue.prototype.$rest = rest;
  }
}
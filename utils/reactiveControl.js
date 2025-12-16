import Vue from 'vue'

export const reactiveControl = {
  _frozen: new WeakSet(),

  freeze(obj) {
    if (!this._frozen.has(obj)) {
      Object.freeze(obj)
      this._frozen.add(obj)
    }
  },

  unfreeze(obj) {
    if (Object.isFrozen(obj)) {
      const newObj = Vue.observable({ ...obj }) // 重新激活响应
      this._frozen.delete(obj)
      return newObj
    }
    return obj
  }
}

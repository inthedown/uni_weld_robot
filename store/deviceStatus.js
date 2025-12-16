import Vue from 'vue';

const deviceStatus = Vue.observable({
  armStatus: '断开',
  cameraStatus: '断开',
  welderStatus: '断开',
});

export default deviceStatus;

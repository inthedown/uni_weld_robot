<template>
  <view :style="containerStyle">
    <slot>
      <svg v-if="svgContent" :width="size" :height="size" viewBox="0 0 1024 1024">
        <path :d="svgContent" :fill="color"></path>
      </svg>
      <image v-else-if="src" :src="src" :style="{ width: size + 'rpx', height: size + 'rpx' }" mode="aspectFit" />
    </slot>
  </view>
</template>

<script>
export default {
  name: 'SvgIcon',
  props: {
    src: { type: String, default: '' },       // 图片 SVG 或 PNG
    svgContent: { type: String, default: '' }, // path 内容
    size: { type: Number, default: 30 },
    color: { type: String, default: '#000' }
  },
  computed: {
    containerStyle() {
      return {
        width: this.size + 'rpx',
        height: this.size + 'rpx',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      };
    }
  }
};
</script>

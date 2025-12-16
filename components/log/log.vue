<template>
  <view class="log-wrapper">
    <scroll-view
      class="log-container"
      scroll-y
      :scroll-top="scrollTop"
      ref="logContainer"
    >
      <view v-for="(log, index) in logs" :key="log.id || index" class="log-line">
        [{{ log.time }}] {{ log.msg }}
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      logs: [],        // 已显示的日志
      lastIndex: 0,    // 上次读取日志索引
      scrollTop: 0
    };
  },
  mounted() {
    this.timer = setInterval(() => {
      if (!this.$logger) return;
      const allLogs = this.$logger.getLogs() || [];
      
      // 只追加新日志
      const newLogs = allLogs.slice(this.lastIndex);
      if (newLogs.length > 0) {
        this.logs.push(...newLogs.map(l => ({ ...l })));
        this.lastIndex = allLogs.length;
  
      }
    }, 500);
	      this.$nextTick(this.scrollToBottom);
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
  methods: {
    scrollToBottom() {
      const container = this.$refs.logContainer;
      if (!container) return;
      uni.createSelectorQuery()
        .in(this)
        .select('.log-container')
        .boundingClientRect(rect => {
          const lineHeight = 22;
          const scrollHeight = this.logs.length * lineHeight;
          this.scrollTop = scrollHeight - rect.height;
          if (this.scrollTop < 0) this.scrollTop = 0;
        })
        .exec();
    }
  }
};
</script>

<style>
.log-wrapper {
  width: 100%;
  height: 100%;
  font-family: monospace;
  font-size: 12px;
  border: 1px solid #333;
  border-radius: 4px;
  overflow: hidden;
  background: #000;
}

.log-container {
  padding: 5px;
  height: 100%;
  color: #02ca08;
}

.log-line {
  white-space: pre-wrap; 
  word-break: break-all;
  text-indent: 1em;
  line-height: 22px;
}
</style>

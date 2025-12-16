<template>
	<view :class="['message-card', typeClass]">
		<span class="icon" v-html="iconSvg"></span>
		<view class="">
			<text v-if="title" class="message-content">{{ title }}<text  class="dots" v-if="titleLoading && message">{{dots}}</text></text>
			<text v-if="message" class="message-content">{{ message }}<text  class=" dots" v-if="isLoading && message">{{dots}}</text></text>
		</view>
		
	</view>
</template>

<script>
	export default {
		name: "MessageCard",
		props: {
			type: {
				type: String,
				default: "info",
				validator: (val) => ["info", "success", "warning", "error", "primary"].includes(val),
			},
			title:{
				type:String
			},
			message: {
				type: String
			},
			isLoading: {
				type: Boolean,
				default: false
			},
			titleLoading: {
				type: Boolean,
				default: false
			},
		},
		data() {
			return {
				dots: "",
				timer: null
			}
		},
		watch: {
			isLoading(newVal) {
				if (newVal) {
					this.startDots();
				} else {
					this.stopDots();
				}
			},
			titleLoading(newVal) {
				if (newVal) {
					this.startDots();
				} else {
					this.stopDots();
				}
			},
		},
		methods: {
			startDots() {
				let count = 0;
				this.timer = setInterval(() => {
					count = (count + 1) % 4; // 0,1,2,3
					this.dots = ".  ".repeat(count);
				}, 500);
			},
			stopDots() {
				clearInterval(this.timer);
				this.timer = null;
				this.dots = "";
			}
		},
		mounted() {
			console.log('isLoading',this.isLoading);
			if (this.isLoading||this.titleLoading) {
				this.startDots();
			}
		},
		beforeDestroy() {
			this.stopDots();
		},
		computed: {
			typeClass() {
				return `message-${this.type}`;
			},
			iconSvg() {
				const icons = {
					info: `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
            stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>`,
					success: `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
            stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
            <path d="M20 6L9 17l-5-5"></path>
          </svg>`,
					warning: `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
            stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12" y2="17"></line>
          </svg>`,
					error: `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
            stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>`,
					primary: `
          <svg t="1754377074841" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="21168" width="200" height="200"><path d="M512 64C264.597333 64 64 264.597333 64 512s200.597333 448 448 448 448-200.597333 448-448S759.402667 64 512 64z m32 664a8.021333 8.021333 0 0 1-8 8h-48a8.021333 8.021333 0 0 1-8-8v-272c0-4.394667 3.605333-8 8-8h48c4.394667 0 8 3.605333 8 8v272zM512 384a48 48 0 1 1 0.021333-96.021333A48 48 0 0 1 512 384z" fill="#1296db" p-id="21169"></path></svg>`,
				};
				return icons[this.type] || "";
			},
		},
	};
</script>

<style scoped>
	.message-card {
		display: flex;
		align-items: center;
		
		border-radius: 6px;
		font-weight: 600;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
		user-select: none;
		font-size: 14px;
	}

	.icon {
		width: 50rpx;
		height: 50rpx;
		margin-left: 18px;
		margin-right: 12px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	.message-info {
		background-color: #909399;
		color: #f0f0f0;
	}

	.message-success {
		background-color: #67c23a;
		color: #fff;
	}

	.message-warning {
		background-color: #e6a23c;
		color: #4b3a00;
	}

	.message-error {
		background-color: #f56c6c;
		color: #fff;
	}

	.message-primary {
		background-color: #ecf8ff;
		color: #409eff;
	}

	.message-content {
		white-space: pre-wrap;
		/* 保留换行符 \n 并自动换行 */
		word-break: break-word;
		display: block;
		width: 100%;
		/* 避免长单词不换行 */
	}
</style>
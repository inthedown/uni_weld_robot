<template>
	<tip-card>
		<view class="tip-card">
			<!-- 顶部区域 -->
			<view class="tip-card-header">
				<!-- 状态三：显示返回按钮 -->
				<!-- 	<view v-if="showBack" class="back-btn" @click="handleBack">
					← 返回
				</view> -->

				<!-- 内容插槽 -->
				<slot name="content"></slot>
			</view>
			<view class="exit-btn" v-if="localCurrentNav==='person'">
				<button style="color:#000000;backgroundColor:#ffffff;" @click="exit">断开连接</button>
			</view>
			<!-- 底部导航栏（仅状态一显示） -->
			<view v-if="state" class="tip-card-footer">
				<view class="nav-item" v-for="(item, idx) in navs" :key="idx" @click="handleNavClick(item)">
					<uni-icons :type="item.icon" size="20" :color="currentNav === item.key ? '#007AFF' : '#999'" />
					<text :style="{ color: currentNav === item.key ? '#007AFF' : '#666' }">
						{{ item.label }}
					</text>
				</view>
			</view>
		</view>
	</tip-card>
</template>

<script>
	import TipCard from "@/components/tip-card/index.vue";
	export default {
		name: "navigateCard",
		components: {
			TipCard,
		},
		props: {
			currentNav: {
				type: String,
				default: "home",
			},
		},
		computed: {
			showBack() {
				return this.state === 3;
			},
			state(){
				return this.$task.mode==='steps';
			}
		},
		watch: {
			state(val) {
				this.localState = val;
			},
			currentNav(val) {
				this.localCurrentNav = val;
			},
			localState(val) {
				this.$emit("update:state", val);
			},
			localCurrentNav(val) {
				// console.log('nav-change',val);
				this.$emit("nav-change", val);
			},
		},
		data() {
			return {
				localState: this.state,
				localCurrentNav: this.currentNav,
				navs: [{
						key: "home",
						label: "首页",
						icon: "home"
					},
					{
						key: "config",
						label: "配置",
						icon: "gear"
					},
					{
						key: "person",
						label: "我的",
						icon: "person"
					},
				],
			};
		},
		methods: {
			handleNavClick(item) {
				this.localCurrentNav = item.key;

			},
			handleBack() {
				this.$emit("back");
			},
			exit() {
				uni.removeStorageSync('device_ip');
				this.$task.reset();
				uni.$emit('exitLanch');
			}
		},
	};
</script>

<style>
	.tip-card {
		display: flex;
		flex-direction: column !important;
		height: 100%;
		width: 100%;
		background-color: #f9f9f9;
		border-radius: 24px 24px 0 0;

	}

	.tip-card-header {
		flex: 1;
		/* padding: 20rpx; */
		position: relative;
		width: 100%;
		border-radius: 24px 24px 0 0;
		background-color: #fff;
	}

	.exit-btn {
		flex: 1;
		width: 100%;
		border-radius: 24px;
		margin-top: 10px;
	}

	.back-btn {
		position: absolute;
		top: 20rpx;
		left: 20rpx;
		font-size: 28rpx;
		color: #007aff;
	}

	.content {
		width: 100%;
		margin-top: 60rpx;
		/* 给返回按钮留空间 */
		min-height: 300rpx;
		max-height: calc(100vh - 300px);
		overflow-y: auto;
	}

	.tip-card-footer {
		flex: 0;
		width: 100%;
		display: flex;
		justify-content: space-around;
		align-items: center;
		height: 100rpx;
		border-top: 1rpx solid #eee;
		background-color: #fff;
		margin-top: 20rpx;
		z-index: 9999;
	}

	.nav-item {
		flex: 1;
		text-align: center;
	}

	.nav-item text {
		display: block;
		margin-top: 6rpx;
		font-size: 24rpx;
	}
</style>
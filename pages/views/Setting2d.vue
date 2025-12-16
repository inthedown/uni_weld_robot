<template>
	<view class="main">
		<view class="sidebar">
			<view v-for="item in menuList" :key="item.path" class="menu-item" :class="{ active: isActive(item.path) }"
				@click="navigate(item.path)">
				<!-- <l-icon :name="item.icon" class="menu-icon" :color="isActive(item.path) ? '#f00' : '#000'" /> -->
				<uni-icons :type="item.type" class="menu-icon" size="24"
					:color="isActive(item.path) ? '#f00' : '#000'"></uni-icons>
				<text class="menu-text">{{ item.name }}</text>
			</view>
			<view class=" exit-btn">
				<text class="menu-text" @click="exit">退出连接</text>
			</view>

		</view>
		<view class="content">
			<weld-config v-if="currentView==='WeldConfig'"></weld-config>
			<reset-arm v-if="currentView==='ResetArm'"></reset-arm>
			<about v-if="currentView==='about'"></about>
		</view>
	</view>
</template>

<script>
	import SvgIcon from '@/components/svg-icon/index.vue';
	import WeldConfig from '@/pages/views/WeldConfig.vue';
	import ResetArm from '@/components/reset-arm/index.vue';
	import about from '@/components/about/index.vue';
	import {
		EventBus
	} from '@/plugin/event-bus';

	export default {
		name: 'About-Index',
		components: {
			SvgIcon,
			WeldConfig,
			ResetArm,
			about
		},
		data() {
			return {
				menuList: [{
						name: '工艺包参数管理',
						path: 'WeldConfig',
						icon: 'frame',
						type: 'settings'
					},
					{
						name: '初始位姿校订',
						path: 'ResetArm',
						icon: 'frame',
						type: 'settings'
					},
					{
						name: '关于',
						path: 'about',
						icon: 'frame',
						type: 'info'
					}
				],
				currentView: 'WeldConfig',
				statusBarHeight: 0
			};
		},

		methods: {
			handleUpdate(data) {
				if (data) {
					console.log("监听到" + data);
					this.currentView = 'WeldConfig';
				}
			},
			navigate(path) {
				this.currentView = path;
			},
			isActive(path) {
				return this.currentView === path;
			},
			handleNevigate(path) {
				console.log('path', path);
				this.currentView = path;
			},
			exit() {
				//清除缓存 
				var that = this;
				uni.showModal({
					title: '提示',
					content: '确定断开焊接系统IP连接',
					confirmText: '取消',
					cancelText: '确定',
					success: function(res) {
						if (res.confirm) {
						} else if (res.cancel) {
							uni.removeStorageSync('device_ip');
							that.$emit('navigateTo', 'Connect');
							EventBus.$emit('device-ip-updated', null);
						}
					}
				});

			}
		}

	}
</script>

<style scoped>
	.main {
		display: flex;
		height: 100%;
		/* 占满全屏 */
		width: 100%;
		background-color: #f5f5f5;
	}

	/* 侧边栏 */
	.sidebar {
		width: fit-content;
		background-color: #fff;
		color: #fff;
		border-right: 1rpx solid #3c3c3c;
		display: flex;
		flex-direction: column;
		/* box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1); */
	}



	/* 内容区 */
	.content {
		flex: 1;
		background-color: #ffffff;
		height: 100%;
		width: 100%;
	}

	.bg-white {
		background-color: white;

		flex-direction: column;
	}

	.bg-black {
		background-color: black;
		min-height: 100vh;
		color: white;
		/* 黑背景文字白色 */
	}


	.menu-item {
		width: 260rpx;

		display: flex;
		align-items: center;
		text-align: center;
		color: #666;
		font-size: 24rpx;
		transition: color 0.3s;
		padding: 30rpx 30rpx 30rpx 30rpx;
		background-color: #ecf8ff;
	}



	.menu-item.active {
		color: #f9001d;
	}

	.menu-icon {
		margin-right: 15rpx;
	}

	.menu-text {
		text-align: center;
	}

	.exit-btn {
		margin-top: auto;
		color: #666;
		font-size: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 30rpx 30rpx 30rpx 30rpx;
		background-color: #ecf8ff;
	}
</style>
<template>

	<!--  系统顶栏-->

	<view class="system-header-top">

		<view class="logo">
			<image mode="aspectFit" :src="logoUrl" class="logo-img" alt="logo" />
		</view>
		<view class="spacer"></view>
		<right-condition v-if="showFlag" class="right-condition"></right-condition>
	</view>
</template>

<script>
	import rightCondition from './components/condition'
	import {
		EventBus
	} from '@/plugin/event-bus';

	export default {
		name: 'HeaderTop',
		components: {
			rightCondition
		},
		data() {
			return {
				// src="/static/logo-image.png"
				logoUrl: '/static/logo-image.png',
				deviceIp: uni.getStorage('device_ip'),
				showFlag: false
			}
		},
		props: {},
		watch: {},
		onLoad() {
			uni.$on('updateDeviceStatus',(data) =>this.handleUpdate(data));
		},
		mounted() {
			EventBus.$on('device-ip-updated', (newIp) => {
				if (newIp) {
					this.deviceIp = newIp;
					console.log('HeaderTop received new IP:', this.deviceIp);
					this.showFlag = true;
				} else {
					this.showFlag = false;
				}

			});
		},
		methods: {
			handleUpdate(data) {
				console.log('收到设备状态更新：', data)
				if (data) {
					this.showFlag = true;
				}
			}
		}
	}
</script>

<style scoped lang="scss">
	.system-header-top {
		width: 100%;
		background: #eeeeee;
		display: flex;
		align-items: center;
		border-bottom: 1px solid #909399;

		.logo {
			margin-left: 25rpx;
			/* 可选，避免紧贴边缘 */
		}

		.logo-img {
			width: 50rpx;
			height: 50rpx;
			display: block;
		}

		.spacer {
			flex: 1;
		}

		.right-condition {
			margin-right: 20px;
		}
	}
</style>
<template>
	<view class="condition">
		<view class="condition-item">
			<image src="@/static/arm.svg" mode="x" style="width: 40rpx; height: 40rpx; margin-right: 10rpx;" />
			<span :class="armClass">机械臂{{ armStatus }}</span>
		</view>
		<view class="condition-item">
			<image src="@/static/camera.svg" mode="aspectFit"
				style="width: 40rpx; height: 40rpx; margin-right: 10rpx;" />
			<span :class="cameraClass">相机{{ cameraStatus }}</span>
		</view>
		<view class="condition-item">
			<image src="@/static/weld.svg" mode="aspectFit" style="width: 40rpx; height: 40rpx; margin-right: 10rpx;" />
			<span :class="welderClass">焊机{{ welderStatus }}</span>
		</view>
	</view>
</template>

<script>
	import deviceStatus from 'store/deviceStatus';
	import {
		EventBus
	} from '@/plugin/event-bus';
	export default {
		name: 'Condition-Index',
		components: {},
		props: {},
		data() {
			return {
				pollTimer: null, // 定时器引用
			};
		},
		computed: {
			armStatus() {
				return deviceStatus.armStatus;
			},
			cameraStatus() {
				return deviceStatus.cameraStatus;
			},
			welderStatus() {
				return deviceStatus.welderStatus;
			},
			armClass() {
				return this.armStatus === '正常' ? 'status-ok' : 'status-error';
			},
			cameraClass() {
				return this.cameraStatus === '正常' ? 'status-ok' : 'status-error';
			},
			welderClass() {
				return this.welderStatus === '正常' ? 'status-ok' : 'status-error';
			},
			allDevicesConnected() {
				return (
					this.armStatus === '正常' &&
					this.cameraStatus === '正常' &&
					this.welderStatus === '正常'
				);
			}
		},
		mounted() {
		// 如果组件一挂载就需要轮询
				this.startPolling();
		},
		beforeDestroy() {
				// 清理定时器
				if (this.pollTimer) clearInterval(this.pollTimer);
			},
		methods: {
				startPolling() {
						if (this.pollTimer) clearInterval(this.pollTimer);
			
						// 每2秒轮询一次接口
						this.pollTimer = setInterval(() => {
							this.fetchDeviceStatus();
						}, 2000);
					},
				fetchDeviceStatus(){
					this.$rest.getDeviceStatus().then(res=>{
						const data = res.data ? res.data : {};
						const isSuccess =
							data.camera_status === true &&
							data.robot_status === true &&
							data.weld_status === true;
						
						const {
							robot_status,
							camera_status,
							weld_status
						} = data;
						
						deviceStatus.armStatus = robot_status ? '正常' : '断开';
						deviceStatus.cameraStatus = camera_status ? '正常' : '断开';
						deviceStatus.welderStatus = weld_status ? '正常' : '断开';
					
					}).catch(err=>{
						deviceStatus.armStatus = '断开';
						deviceStatus.cameraStatus = '断开';
						deviceStatus.welderStatus = '断开';
					})
				}
		},
		watch: {
			
		}
	}
</script>

<style>
	.condition {
		display: flex;
		/* 容器内一行排列 */
		gap: 10px;
		/* 项之间的间距，可根据需要调整 */
	}

	.icon {
		width: 30px;
		height: 30px;
		color: #000000;
		/* 图标大小 */
		fill: currentColor;
		/* 使用当前文本颜色 */
		margin-right: 6px;
		/* 图标与文字间距 */
		vertical-align: middle;
		stroke-width: 7;

	}

	.condition-item {
		display: flex;
		/* 图标和文字横向排列 */
		align-items: center;
		/* 垂直居中 */
		gap: 6px;
		/* 图标与文字间距 */
		padding: 3px 5px;
	}

	.condition-item span {
		white-space: nowrap;
		font-weight: bold;
	}

	.status-ok {
		color: #000;
		font-size: 24rpx;
	}

	.status-error {
		color: #D1272A;
		font-size: 24rpx;
	}
</style>
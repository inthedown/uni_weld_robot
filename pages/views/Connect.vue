<template>
	<div class="connect-container">
		<view class="connect-card">
			<view class="card-header">
				<text class="required-star">*</text>焊接系统 IP
			</view>
			<view class="form-item">
				<uni-easyinput type="text" :clearable="true" placeholder="请输入要连接系统IP地址" v-model="form.ip" />
			</view>
			<button class="connect-btn" :loading="loading" :disabled="loading" @click="handleConnect">
				{{ loading ? '连接中...' : '连接' }}
			</button>
		</view>
	</div>
</template>

<script>
	import deviceStatus from '@/store/deviceStatus';
	import {
		EventBus
	} from '@/plugin/event-bus';

	export default {
		name: 'ConnectCard',
		data() {
			return {
				form: {
					ip: ''
				},
				loading: false
			};
		},
		mounted() {
			const deviceIp=uni.getStorageSync('device_ip');
			if(deviceIp){
				this.form.ip=deviceIp.split(':')[0];
				this.handleConnect();
			}
		},
		methods: {
			isValidIP(ip) {
				const ipRegex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
				return ipRegex.test(ip);
			},
			handleConnect() {
				if (!this.isValidIP(this.form.ip)) {
					uni.showToast({
						title: 'ip地址填写有误',
						icon: 'error', // success / none / loading / error (部分平台不支持 error)
						duration: 1500
					});
					return;
				}

				//存储到localStorage
				this.loading = true;

				const ip = this.form.ip + ':' + this.$config.serverPort;
				this.$rest.getDeviceStatus(ip)
					.then(res => {
						console.log(res);
						const data = res.data ? res.data : {};
						uni.showToast({
							title: '连接成功',
							icon: 'success', // success / none / loading / error (部分平台不支持 error)
							duration: 1500
						});
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

						if (isSuccess) {
							//存储到数据库
							this.$sql.insertOrUpdateDevice(this.form.ip).then(res => {
								this.$emit('connect', this.form.ip);
								uni.setStorageSync('device_ip', this.form.ip + ':54321');
								uni.showToast({
									title: '连接成功',
									icon: 'success', // success / none / loading / error (部分平台不支持 error)
									duration: 2000
								});
								EventBus.$emit('device-ip-updated', this.form.ip);
								uni.$emit('updateDeviceStatus', true);
							}).catch(err => {
								console.log('保存机械臂数据失败', err.msg);
								uni.showToast({
									title: '保存机械臂数据失败',
									icon: 'error', // success / none / loading / error (部分平台不支持 error)
									duration: 2000
								});
							})

						} else {
							uni.showModal({
								title: '提示',
								content: '设备状态异常，请检查连接',
								showCancel: false
							});
						}
						this.loading = false;
					})
					.catch(err => {
						console.log(err);
						uni.showModal({
							title: '提示',
							content: '连接失败，请检查IP地址或网络',
							showCancel: false
						});
						this.loading = false;
					});
			}
		}
	};
</script>

<style scoped>
	.connect-container {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		/* 垂直居中 */
		justify-content: center;
		/* 水平居中 */
		overflow: hidden;
		/* 防止内容溢出 */
		box-sizing: border-box;
		/* 计算内边距 */
	}

	/* 
.connect-card {
    width: 320px;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
    font-size: 16px;
    font-weight: bold;
}

.connect-btn {
    background-color: #D1272A;
 
    color: white;

    width: 100%;
}

.required-star {
    color: #D1272A;
    margin-left: 4px;
    margin-right: 4px;

    font-size: 18px;
    vertical-align: middle;
    font-weight: bold;
} */

	.connect-card {
		width: 320px;
		padding: 20px;
		background-color: #fff;
		border-radius: 6px;
		margin: 20px;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
	}

	.card-header {
		font-weight: bold;
		font-size: 16px;
		margin-bottom: 50rpx;
	}

	.required-star {
		color: red;
		margin-right: 5px;
	}

	.form-item {
		margin-bottom: 50rpx;

	}

	.input {
		width: 100%;
		height: 40px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 14px;
	}

	.connect-btn {
		width: 100%;
		height: 40px;
		background-color: #D1272A;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 16px;
	}

	.connect-btn[disabled] {
		background-color: #d1272a;
		color: white;
	}
</style>
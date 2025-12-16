<template>
	<view class="container">
		<view class="left-panel">
			<button v-for="(btn, index) in buttons" :key="index" class="btn" @click="handleClick(btn)">
				{{ btn.label }}
			</button>
		</view>
		<view class="right-panel">
			<scroll-view scroll-y class="result-box">
				<text>{{ result }}</text>
			</scroll-view>
		</view>
		<view style="padding: 10px; background: #f0f0f0; margin-top: 20px;">
			<text selectable>{{ debugLog }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				buttons: [{
						label: '请求 1',
						url: 'http://localhost:3000/api/test1'
					},
					{
						label: '请求 2',
						url: 'http://localhost:3000/api/test2'
					},
					{
						label: '请求 3',
						url: 'http://localhost:3000/api/test3'
					},
				],
				result: '',
				debugLog: ''
			}
		},
		methods: {
			handleClick(btn) {
				this.result = '请求中...';
				switch (btn.label) {
					case "请求 1":
						this.handleBtn1();
						break;
					case "请求 2":
						this.handleBtn2();
						break;
				}

			},
			handleBtn1() {
				const ip = uni.getStorageSync('device_ip')
				uni.request({
					url: `http://${ip}/channel_read?channel&node`,
					method: 'POST',
					data: {
						channel: 'RestChannel',
						node: 'weld',
						data: {
							type: 'initial_image',
							status: 1
						}
					},
					timeout: 5000,
					success: (res) => {
						const data = res.data.data
						this.result = data
					},
					fail: (err) => {

					}
				})
			},

			handleBtn2() {
				const deviceIp = uni.getStorageSync('device_ip');
				const IP = deviceIp.split(":")[0]; // 从 device_ip 提取 IP
				const wsUrl = 'ws://' + IP + ':54321/ws?camera=Cam01';
				// 建立连接
				uni.connectSocket({
					url: wsUrl,
					success: () => {
						console.log('WebSocket 发起连接成功');
						this.debugLog += 'WebSocket 发起连接成功';
					},
					fail: (err) => {
						console.error('WebSocket 连接失败:', err);
						this.debugLog += 'WebSocket 连接失败:'
						this.debugLog += err
					}
				});
				// 连接打开
				uni.onSocketOpen(() => {
					console.log('WebSocket 连接已建立');
					this.debugLog += 'WebSocket 连接已建立'
				});

				// 接收消息
				uni.onSocketMessage((res) => {
					try {
						// const arrayBuffer = res.data;
						// const uint8Array = new Uint8Array(res.data);
						// 
						// const text = String.fromCharCode.apply(null, uint8Array);
						// this.debugLog += '字符串结果:' + text + '；'
						const arrayBuffer = res.data;
						const uint8Array = new Uint8Array(arrayBuffer);
						
						// 尝试用 TextDecoder 解码
						let text = '';
						if (typeof TextDecoder !== 'undefined') {
							this.debugLog += 'TextDecoder 解码开始；'
							const decoder = new TextDecoder('utf-8');
							text = decoder.decode(uint8Array);
							this.debugLog += 'TextDecoder 解码结束；'
						} else {
							// fallback 分块解码
							this.debugLog += 'fallback  解码开始；'
							let CHUNK_SIZE = 0x8000;
							for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
								text += String.fromCharCode.apply(null, uint8Array.subarray(i, i + CHUNK_SIZE));
							}
							this.debugLog += 'fallback  解码结束；'
						}
						
						
						
						const json = JSON.parse(text);
						this.debugLog += 'json 解码成功；'
						this.result = json;
						const data = json.data || {};
						this.status = data.status;
						this.cameraImage = data.camera_image;
					} catch (e) {
						console.error('解析消息失败:', e);
						this.debugLog += ('解析消息失败:' + e.message)
					}
				});

				// 连接错误
				uni.onSocketError((err) => {
					console.error('WebSocket 错误:', err);
					this.debugLog += ('WebSocket 错误:' + err.errMsg)
				});

				// 连接关闭
				uni.onSocketClose(() => {
					console.log('WebSocket 连接关闭');
				});
			}

		}
	}
</script>

<style>
	container {
		display: flex;
		flex-direction: row;
		height: 100vh;
	}

	.left-panel {
		width: 30%;
		background-color: #f0f0f0;
		padding: 10px;
	}

	.btn {
		margin-bottom: 10px;
		background-color: #4caf50;
		color: white;
		padding: 12px;
		border-radius: 8px;
		font-size: 16px;
	}

	.right-panel {
		flex: 1;
		padding: 10px;
		background-color: #fff;
	}

	.result-box {
		border: 1px solid #ccc;
		border-radius: 8px;
		height: 100%;
		padding: 10px;
		white-space: pre-wrap;
		font-family: monospace;
		background-color: #f9f9f9;
	}
</style>
<template>
	<view class="operation-panel">
		<view class="panel-item" v-for="(item, index) in actions" :key="index" @click="handleClick(item)">
			<!-- 判断是否为模拟运行 -->
			<!-- <l-icon :name="item.icon" color="#fff" size="50rpx" /> -->
			<image :src="item.path" class="img-icon"></image>
			<text class="panel-label">{{ item.label }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				actions: [{
						label: '识别',
						path: '/static/operate-camera.svg'
					},
					{
						label: '模拟运行',
						path: '/static/operate-route.svg'
					},
					{
						label: '开始焊接',
						path:'/static/operate-fire.svg'
					},
					{
						label: '重置机械臂',
						path: '/static/operate-reset.svg'
					}
				]
			}
		},
		methods: {
			handleClick(item) {			
				this.$emit('changeTask',item.label);	
			}
		}
	}
</script>

<style>
	.operation-panel {
		position: fixed;
		z-index: 999;
		background: rgba(0, 0, 0, 0.6);
		border-radius: 20rpx;
		padding: 20rpx 10rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		top: 50%;
		right: 10rpx;
		transform: translateY(-50%);
	}

	.panel-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.panel-label {
		font-size: 22rpx;
		color: #fff;
		margin-top: 8rpx;
	}

	.panel-svg {
		width: 40rpx;
		height: 40rpx;
		color: #fff;
	}
	.img-icon{
		width: 40rpx;
		height: 40rpx;
		color: #fff;
		background-attachment: white;
	}
</style>
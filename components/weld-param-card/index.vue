<template>
	<view class="card">
		<view class="card-main">
			<view class="card-header">
				<text class="name">工艺包名称 ：{{ pkg.name }}</text>
			</view>
			<view class="card-body">
				<view class="row">
					<text class="label">焊枪摆幅： <text class="value">{{ pkg.amplitude }} mm</text></text>
					<text class="label">焊枪电流： <text class="value">{{ pkg.electric }} A</text></text>
				</view>
				<view class="row">
					<text class="label">弧长矫正电压： <text class="value">{{ pkg.voltage }} V</text></text>
					<text class="label">行进速度：<text class="value">{{ pkg.speed }} mm/s</text></text>
				</view>
			</view>
		</view>
		<view class="operate-bar">
			<view class="slot-button edit" @click="$emit('edit', pkg)">修改</view>
			<view class="slot-button delete" @click="$emit('delete', pkg)">x</view>
		</view>

	</view>
</template>

<script>
	export default {
		name: "WeldParamCard",
		props: {
			pkg: {
				type: Object,
				required: true
			},
			index: {
				type: Number,
				required: true
			}
		}
	}
</script>

<style lang="scss" scoped>
	.card {
		background: #fff;
		/* margin: 20rpx; */
		margin-bottom: 20rpx;
		padding: 20rpx;
		border-radius: 12rpx;
		border: 1px solid rgba(0, 0, 0, 0.1);
		display: flex;
		/* 左右布局 */
		flex-direction: row;
		justify-content: space-between;
		align-items: stretch;
		/* 让右边高度跟左边一样 */
	}

	.card-main {
		flex: 1;
		/* 占满左侧空间 */
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		font-weight: bold;
		font-size: 12px;
		margin-bottom: 10px;
		color: #333;
	}

	.row {
		display: flex;
		margin-bottom: 10rpx;
	}

	.label {
		color: #666;
		width: 240rpx;
		font-size: 12px;
	}

	.value {
		color: #333;
		font-size: 12px;
	}

	.card-footer {
		display: flex;
		justify-content: flex-end;
		margin-top: 20rpx;
	}

	.action-button {
		text-align: center;
		color: #fff;
	}

	.operate-bar {
		display: flex;
		flex-direction: row;
		/* 垂直排列按钮 */
		justify-content: center;
		/* 垂直居中 */
		align-items: center;
		// min-width: 100rpx;
		/* 固定宽度，不至于太窄 */
		
		/* 可选 */
	}

	.slot-button {
		padding:  0 10px;
		text-align: center;
		background-color: #fff;
		font-size: 10px;
	}


	.edit {
		color: $uni-color-primary;
	}

	.delete {
		color: #000;
	}
</style>
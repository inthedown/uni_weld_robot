<template>
	<!-- <view class="overlay" @tap="handleBackgroundClick"> -->
	<view class="card">
		<view v-if="title" class="card-title">{{ title }}</view>
		<view class="card-content">
			<slot></slot> <!-- 插槽内容 -->
		</view>
	</view> 
	<!-- </view> -->
</template>

<script>
	export default {
		name: 'TipCard',
		props: {
			title: {
				type: String,
				default: '',
			},
			closeOnBackground: {
				type: Boolean,
				default: true,
			}
		},
		methods: {
			handleBackgroundClick() {
				if (this.closeOnBackground) {
					this.$emit('close');
				}
			}
		}
	};
</script>

<style scoped>
	.card {
		height: fit-content;
		min-width: 400rpx;
		border-radius: 20px 20px;
		/* background-color: #fbfeffb3; */
		display: flex;
		flex-direction: column;
		background-color: #ffffff;
	}

	.card-title {
		font-size: 14px;
		font-weight: bold;
		color: black;
		flex-shrink: 0;
		text-align: left;
		margin-left: 20px;
		margin-top: 10px;
	}

	.card-content {

		height: 100%;
		flex: 1;
		box-sizing: border-box;
		background-color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 24px 24px 0 0;
		
	}
</style>
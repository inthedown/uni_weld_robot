<template>
	<view class="about-page-cont">
		<view class="about-page-1">
			<view>
				<image style="width: 150rpx; height: 150rpx;" mode="aspectFit" src="@/static/logo-image.png" alt="">
			</view>
			<view>
				<view class="about-page-title">MITAN AGV</view>
				<view class="about-page-text">电话：0571-88862530</view>
				<view class="about-page-text">邮箱：zongyu.li@mitanai.com</view>
				<view class="about-page-text">官网：https://www.mitanai.com/</view>
			</view>
			<view class="about-page-text">如需获取产品资料或教学视频，请发送邮件或拨打电话联系我们。</view>
		</view>
		<view class="about-page-2">
			<view>Copyright(C) 2018-2025 MiTan V1.2.{{version}}</view>
		</view>
	</view>
</template>

<script>
	import versionInfo from '@/version.json'
	export default {
		name: "about",
		data() {
			return {
				version: versionInfo.version,
				lastUpdateTime: versionInfo.last_update_time
			}
		}
	}
</script>


<style scoped lang="scss">
	.about-page-cont {
		height: 100%;
		display: flex;
		flex-direction: column;
		text-align: center;
		background-color: #ffffff;
		padding-top: 10px;
		border-radius: 24px;
		.about-page-1 {
			height: 400px;
			display: flex;
			flex-direction: column;
			justify-content: center;
			color: #000000;

			.about-page-icon {
				margin-bottom: 30px;
			}

			.about-page-title {
				font-size: 18px;
				font-weight: bold;
				margin-bottom: 34px;
			}

			.about-page-text {
				margin-bottom: 10px;
				font-size: 12px;
			}
		}

		.about-page-2 {
			// height: 60px;
			color: #000000;
			font-size: 10px;
			margin-bottom: 20px;
		}
	}
</style>
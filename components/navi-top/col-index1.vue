<template>
	<view class="step-container">
		<template v-for="(step, index) in steps">
			<view class="step-item" :key="'step-' + index">
				<view class="step-content" @click="handleStepClick(index, step)">
					<!-- 用 sx-svg 替代 uni-icons -->
					<sx-svg :name="step.icon" :color="getColor(index)" size="40" class="step-icon" />
					<text class="step-text" :style="{ color: getColor(index) }">
						{{ step.name }}
					</text>
				</view>
			</view>

			<!-- 分隔线替换为箭头 -->
			<uni-icons v-if="index < steps.length - 1" type="right" size="20" color="#999" :key="'divider-' + index"
				class="step-arrow" />
		</template>
	</view>
</template>

<script>
	export default {
		name: "NaviBar",
		props: {
			currentStep: {
				type: Number,
				default: 0,
			},
			weld_class: {
				type: String,
				default: "",
			},
		},
		data() {
			return {
				steps: [{
						name: "建立点云",
						icon: "operate_focus",
						active: true
					},
					{
						name: "识别焊缝",
						icon: "operate_identity",
						active: false
					},
					{
						name: "模拟焊接",
						icon: "operate_simulate",
						active: false
					},
					{
						name: "开始焊接",
						icon: "operate_weld",
						active: false
					}
				]
			};
		},
		computed: {
			localStep: {
				get() {
					return this.currentStep;
				},
				set(val) {
					this.$emit("update:currentStep", val);
				},
			},
			localWeldClass: {
				get() {
					return this.weld_class;
				},
				set(val) {
					this.$emit("update:weld_class", val);
				},
			},
		},
		methods: {
			getColor(index) {
				if (index <= this.localStep) return "#000000";
				return "#999999";
			},
			handleStepClick(index, step) {
				if (index > this.localStep) return;
				this.localStep = index;
				this.$emit("update:currentStep", index);
			},
		},
	};
</script>

<style>
	.step-container {
		display: flex;
		flex-direction: row;
		/* 改为竖向 */
		align-items: center;
		justify-content: space-between;
		padding: 40rpx 40rpx;
		background-color: #fff;
		border-radius: 12px;
	}

	.step-item {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.step-content {
		display: flex;
		flex-direction: column;
		/* 图标在上，文字在下 */
		align-items: center;
		gap: 5rpx;
	}

	.step-icon {
		margin-bottom: 5rpx;
	}

	.step-text {
		font-size: 12px;
		text-align: center;
	}

	.divider {
		width: 80rpx;
		/* 横线宽度 */
		height: 2rpx;
		background-color: #ccc;
		margin: 20rpx 0;
	}
</style>
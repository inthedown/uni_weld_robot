<template>
	<view class="step-container">
		<template v-for="step in steps">
			<view class="step-item" :key="'step-' + step.index">
				<view class="step-content" @click="handleStepClick(step.index)">
					<!-- 用 sx-svg 替代 uni-icons -->
					<sx-svg :name="step.icon" :color="getColor(step.index)" size="40" class="step-icon" />
					<text class="step-text" :style="{ color: getColor(step.index) }">
						<template v-if="step.index === 1">
							{{ hasBuiltPointCloud ? '点云重建' : '建立点云' }}
						</template>
						<template v-else>
							{{ step.name }}
						</template>
					</text>
				</view>
			</view>

			<!-- 分隔线 -->
			<view v-if="step.index <= steps.length - 1" class="divider" :key="'divider-' + step.index"></view>
		</template>
	</view>
</template>

<script>
	export default {
		name: "NaviBar",
		data() {
			return {

			};
		},
		computed: {
			currentStep() {
				return this.$task.currentStep
			},
			stepCompleted() {
				return this.$task.stepCompleted
			},
			currentStepConfig() {
				return this.$task?.steps?.find(s => s.index === this.$task.currentStep) || {}
			},
			steps() {
				return this.$task?.steps || {};
			},
			hasBuiltPointCloud() {
				return this.$task.hasBuiltPointCloud;
			},
			mode() {
				return this.$task.mode;
			}
		},
		methods: {
			getColor(index) {
				const step = this.steps.find(s => s.index === index) || {}
				if (!step || typeof step.canExecute !== 'function') {
					return "#999"; // 或者其他默认值
				}
				return step.canExecute() ? "#000" : "#999";
			},
			handleStepClick(index) {
				const step = this.steps.find(s => s.index === index) || {}
				if (!step || typeof step.canExecute !== 'function') {
					return; // 或者其他默认值
				}
				if (!step.canExecute()) return;
				if ((index === 5 || index === 4) && this.mode != 'detail') {
					this.$task.currentStep = 2;
				} else if((index === 5 || index === 4) && this.mode == 'detail'){
					console.log('this.$task.weldParam',this.$task.weldParam)
					if(this.$task.weldParam){
						this.$task.currentStep = index;
						this.$task.stepCompleted = false;
						this.$task.stepTrigger++;
					}else{
						this.$task.isParamSet=true;
					}
				} else if (index === 1) {
					this.$task.reset();
					this.$task.currentStep=1;
					this.$task.hasBuiltPointCloud = true;
					this.$task.stepCompleted = false;
					this.$task.stepTrigger++;
				} else {
					this.$task.currentStep = index;
					console.log('11141')
					this.$task.stepCompleted = false;
					this.$task.stepTrigger++;
				}
				this.$task.mode = "detail";

				this.$emit('showNav', false);
			},
		},
	};
</script>

<style>
	.step-container {
		display: flex;
		flex-direction: column;
		/* 改为竖向 */
		align-items: center;
		justify-content: flex-start;
		padding: 20rpx 10rpx;
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
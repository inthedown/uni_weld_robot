<template>
	<view class="container">
		<view v-if="mode === 'steps'" class="step-container">
			<template v-for="step in steps">
				<view class="step-item" :key="'step-' + step.index">
					<view class="step-content" @click="enterDetail(step.index)">
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
				<uni-icons v-if="steps && step.index <= steps.length - 1" type="right" size="20" color="#999"
					class="step-arrow" />
			</template>
		</view>
		<view v-else class="detail-container">
			<view v-if="stepCompleted" class="back-btn" @click="backToSteps">
				<uni-icons type="left" size="20" color="#000" />
				<!-- <text>返回</text> -->
			</view>
			<view class="detail-content">
				<text v-if="!stepCompleted && currentStep<3 "> {{ steps[currentStep-1].name }}中... </text>
				<text v-if="stepCompleted && currentStep<3"> {{ steps[currentStep-1].name }}完成 </text>
				<text v-if="!stepCompleted && currentStep===3 && !editMode">生成焊缝中...</text>
				<text v-if="!stepCompleted && currentStep===3 && editMode">更新焊缝中...</text>
				<text v-if="!stepCompleted && currentStep===6">保存焊缝中...</text>
				<text v-if="stepCompleted && currentStep===3 && editMode">提示：可移动图片中的端点来调整焊缝位置</text>
				<view class="detail-content-card">
					<weld-set v-if="stepCompleted && currentStep===3 && !editMode"></weld-set>
				</view>
				<view class="detail-content-card">
					<weld-param v-if="stepCompleted && currentStep===3 && !editMode"
						@handleChange="changeParam"></weld-param>
				</view>
				<view class="detail-content-card">
					<welding-message v-if="currentStep===5 || currentStep===4"></welding-message>
				</view>
			</view>
			<view class="detail-actions" v-if="stepCompleted">
				<view v-if="currentStep===3 && editMode">
					<button class="my-btn" v-for="(btn, index) in editButton" :key="index" size="mini" :type="btn.type"
						@click="handleButtonClick(btn, $task.currentStep)">
						{{ btn.text }}
					</button>
				</view>
				<view v-if="!(currentStep===3 && editMode)">
					<button class="my-btn" v-for="(btn, index) in currentStepConfig.button||{}" :key="index" size="mini"
						:type="btn.type" @click="handleButtonClick(btn, $task.currentStep)">
						{{ btn.text }}
					</button>
				</view>

			</view>


		</view>


	</view>
</template>


<script>
	import {
		reactiveControl
	} from '@/utils/reactiveControl'
	import WeldParam from "@/components/weld-param/index.vue";
	import WeldingMessage from "@/components/welding-message/index.vue";
	import WeldSet from "@/components/weld-set/index.vue";
	export default {
		name: "StepFlow",
		components: {
			WeldParam,
			WeldingMessage,
			WeldSet
		},

		computed: {
			currentStep() {
				return this.localTask.currentStep
			},
			stepCompleted() {
				return this.localTask.stepCompleted
			},
			currentStepConfig() {
				return this.localTask.steps?.find(s => s.index === this.localTask.currentStep) || {}
			},
			steps() {
				return this.localTask.steps || {};
			},
			hasBuiltPointCloud() {
				return this.localTask.hasBuiltPointCloud;
			},
			mode() {
				return this.localTask.mode;
			},
			currentWeld() {
				return this.$task.currentWeld
			},
			editMode(){
				return this.$task.editMode
			}
		},
		watch: {
			currentStep(newVal, oldVal) {
				if (newVal === oldVal + 1) {
					this.$task.stepCompleted = false;
					this.$task.mode = "detail";
				}
			},
			'$task': {
				handler(newVal, oldVal) {
					// console.log('$oldValtask', this.localTask)
					// console.log('$newValValtask',newVal)
					if (this.localTask.currentStep === 5 && newVal.currentStep === 0) {
						console.log('重置')
						const keepKeys = ['currentStep'] // 想保留的字段
						// 复制时跳过这些字段
						const updated = {}
						for (const key in newVal) {
							if (keepKeys.includes(key)) {
								updated[key] = this.localTask[key] // 保留原来的值
							} else {
								updated[key] = newVal[key]
							}
						}
						this.localTask = updated
						this.$task.reset();
						this.$task.currentStep = 0;

					} else {
						this.localTask = {
							...newVal
						} // 只有未暂停时才同步
					}
					// console.log('this.localTask', this.localTask)
				},
				deep: true
			},
			currentWeld(newVal) {
				if (newVal && Object.keys(newVal).length > 0) {
					this.$task.editMode = true;

				}
			}
		},
		data() {
			return {
				reactivePaused: false,
				editButton: [
				// 	{
				// 	type: "info",
				// 	text: "清除焊缝"
				// }, 
				{
					type: "primary",
					text: "保存焊缝"
				}],
				localTask: {
					currentStep: 0,
					mode: '',
					steps: [],
					weldList: [],
					weldParam: {},
				}
			};
		},
		mounted() {
			this.localTask = this.deepCloneWithFunctions(this.$task) // 初始化时复制一份
		},
		methods: {

			getColor(index) {
				const step = this.steps.find(s => s.index === index) || {}
				if (!step || typeof step.canExecute !== 'function') {
					return "#999"; // 或者其他默认值
				}
				return step.canExecute() ? "#000" : "#999";
			},
			enterDetail(index) {
				console.log('enterDetail ndex', index)
				const step = this.steps.find(s => s.index === index) || {}
				if (!step || typeof step.canExecute !== 'function') {
					return; // 或者其他默认值
				}
				if (!step.canExecute()) return;

				if ((index === 5 || index === 4) && this.mode != 'detail') {
					this.$task.currentStep = 3;
					console.log('仅展示工艺包配置');
					this.$task.mode = "detail";
					this.$emit('showNav', false);
				} else if (index === 1) {
					this.$task.reset();
					this.$task.currentStep = 1;
					this.$task.hasBuiltPointCloud = true;
					this.$task.stepCompleted = false;
					this.$task.stepTrigger++;
					this.$task.mode = "detail";
					this.$emit('showNav', false);
					
				} else {
					
					this.$task.currentStep = index;
					this.$task.stepCompleted = false;
					this.$task.stepTrigger++;
					this.$task.mode = "detail";
					this.$emit('showNav', false);
				}


			},
			backToSteps() {
				if (this.editMode) {
					this.$task.editMode = false;
					this.$task.showImage=false;
					return;
				}
				this.$task.mode = "steps";
				this.$emit('showNav', true);
				// this.currentStepConfig.status = 'COMPLETED'
				// if (this.localTask.currentStep === 4) {
				// 	this.$task.reset();
				// 	this.localTask = {
				// 		...this.$task
				// 	};
				// }
			},
			handleButtonClick(btn, stepIndex) {
				if (btn.text === '建立点云') {
					this.$task.reset();
					this.$task.currentStep = 1;
					this.$task.stepCompleted = false;
					this.$task.hasBuiltPointCloud = true;
					this.$task.stepTrigger++;
				} else if (btn.text === '识别焊缝') {
					this.$task.currentStep = 2;
					this.$task.stepCompleted = false;
					this.$task.stepTrigger++;
				} else if (btn.text === '编辑焊缝') {
					console.log('编辑焊缝')
					this.$task.currentStep = 3;
					this.$task.stepCompleted = false;
					this.$task.stepTrigger++;

				} else if (btn.text === '模拟焊接') {
					console.log('执行模拟焊接逻辑')
					if (!this.checkParam()) return;
					this.$task.currentStep = 4;
					this.$task.stepCompleted = false;
					this.$task.stepTrigger++;
				} else if (btn.text === '工艺包配置') {
					console.log('打开工艺包配置弹窗')
					this.$task.currentStep = 3;
					this.$task.stepCompleted = true;
				} else if (btn.text === '开始焊接'||btn.text === '再次焊接') {
					console.log('开始焊接')
					if (!this.checkParam()) return;
					this.$task.currentStep = 5;
					this.$task.stepTrigger++;
					this.$task.stepCompleted = false;
					this.$task.hasBuiltPointCloud = false;
				} else if (btn.text === '保存焊缝') {
					this.$task.currentStep = 6;
					this.$task.stepTrigger++;
					this.$task.stepCompleted = false;
				} else if (btn.text === '清除焊缝') {

				}
			},
			changeParam(param) {
				console.log("param", param);
				this.$task.weldParam = param;
				if (param && Object.keys(param).length > 0) {
					this.$task.isParamSet = false;
				}
				console.log("this.$task.isParamSet", this.$task.isParamSet);
			},
			checkParam() {
				const weldParam = this.$task.weldParam;
				if (!weldParam || Object.keys(weldParam).length === 0) {
					this.$task.isParamSet = true;
					uni.showToast({
						title: "请新增工艺包配置",
						icon: "none",
					});
					return false;
				}
				return true;
			},
			deepCloneWithFunctions(obj) {
				if (obj === null || typeof obj !== 'object') return obj
				if (Array.isArray(obj)) return obj.map(this.deepCloneWithFunctions)

				const cloned = {}
				for (const key in obj) {
					const value = obj[key]
					cloned[key] = typeof value === 'object' && value !== null ?
						this.deepCloneWithFunctions(value) :
						value
				}
				return cloned
			}
		}
	};
</script>

<style lang="scss" scoped>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* 步骤条模式 */
	.step-container {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		background: #fff;
		border-radius: 24px 24px 0 0;
		box-sizing: border-box;
		padding: 40rpx 40rpx;
		width: 100%;
	}

	.step-item {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.step-content {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.step-text {
		font-size: 12px;
	}

	.step-arrow {
		margin: 20rpx 0;
	}

	/* 详情模式 */
	.detail-container {
		width: 100%;
		min-height: 300rpx;
		display: flex;
		flex-direction: column;
		border-radius: 24px 24px 0 0;
		background-color: #f9f9f9;
		// overflow-x: hidden;
	}

	.back-btn {
		display: flex;
		align-items: center;
		gap: 10rpx;
		margin-top: 10px;
		margin-left: 10px;
	}

	.detail-content {
		flex: 1;
		display: flex;
		flex-direction: column;

		min-height: 300rpx;
		justify-content: center;
		border-radius: 24px 24px 0 0;
		/* 水平居中 */
		align-items: center;
		// margin: 10rpx 0;
		font-size: 16px;
		text-align: center;
		color: black;

		.detail-content-card {
			margin-bottom: 10px;
			width: 100%;
			height: 100%;
		}
	}

	.detail-actions {
		display: flex;
		justify-content: flex-end;
		// margin-top: 10px;
		background-color: #fff;
		padding: 20rpx 10rpx;
		z-index: 9999;
		.my-btn {
			margin-left: 10px;
			/* 直接把按钮推到最右 */
			margin-right: 0 !important;
			/* 避免默认100% */
			border-radius: 20px;
		}
	}

	/* Step 3 完成时，将 detail-container 变为透明 */
	.detail-container.no-bg {
		background-color: transparent !important;
	}

	/* Step 3 的两张卡片，样式模仿你原 detail-content */
	.step3-card {
		width: 100%;
		background-color: #fff;
		border-radius: 24px;
		box-sizing: border-box;
		padding: 30rpx 20rpx;
		margin: 20rpx 0;
		min-height: 200rpx;

		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		/* 轻微阴影（可选） */
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
	}
</style>
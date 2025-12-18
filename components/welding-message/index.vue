<template>
	<tip-card :title="title">
		<view class="content">
			<view class="weld-progress-list">
				<view v-for="task in weldList" :key="task.id" :class="[
            'weld-task',
            task.status,
            { 'current-task': task.status === 'in_progress' },
          ]">
					<text class="task-name">{{ task.name }}</text>

					<template v-if="task.status === 'done'">
						<view class="status">
							<!-- <uni-icons type="checkbox" color="#67C23A" size="15" /> -->
							<text class="task-text done-text">✅已完成</text>
						</view>
					</template>

					<template v-else-if="task.status === 'in_progress'">
						<text class="task-text in-progress-text">焊接中 ...</text>
					</template>

					<template v-else-if="task.status === 'waiting'">
						<text class="task-text waiting-text">等待焊接 ...</text>
					</template>

					<template v-else-if="task.status === 'error'">
						<text class="task-text error-text">异常</text>
					</template>
				</view>
			</view>
		</view>
	</tip-card>
</template>
<script>
	import MessageCard from "@/components/message-card/index.vue";
	import TipCard from "@/components/tip-card/index.vue";
	export default {
		name: "WeldingMessage",
		components: {
			MessageCard,
			TipCard
		},
		data() {
			return {};
		},
		watch: {

		},
		computed: {
			weldParam() {
				return this.$task.weldParam;
			},
			weldList() {
				return this.$task.weldList;
			},
			title() {
				if (this.$task.currentStep === 4) {
					return `模拟焊接进度`
				} else if (this.$task.currentStep === 5) {
					return `真实焊接进度`
				} else return `焊接进度`

			},
			message() {
				console.log(this.is_finished);
				if (this.is_finished) {
					return "";
				}
				if (this.is_simulate) {
					return `当前模拟焊接 ${this.currentName}`
				}
				return `当前焊接 ${this.currentName}`;
			},
			currentName() {
				const task = this.weld_list.find((item) => item.status === "in_progress");
				if (this.is_simulate) {
					return task ? task.name : "无正在模拟焊接任务";
				}
				return task ? task.name : "无正在焊接任务";
			},
			getType() {
				return 'primary';
			}
		},
		methods: {
			updateMessage(newMessage) {
				this.message = newMessage;
			},
			gotoFirstStep() {
				console.log('gotoFirstStep');
				if (this.is_simulate) {
					this.$emit('goto-steps', 3);
				} else {
					this.$emit('goto-steps', 0);
				}

			}
		},
	};
</script>
<style lang="scss" scoped>
	.content {
		// display: flex;
		// flex-direction: column;
		// height: 100%;
		width: 100%;
		max-height: 600rpx;
		min-height: 300rpx;
		color: #000;
		overflow-y: auto;
	}

	.weld-progress-list {

		background-color: #fff;
		color: #000;
		padding: 20rpx;
		/* width: 60%; */
	}

	.weld-task {
		display: flex;
		align-items: center;
		justify-content: space-between;

		margin-bottom: 10px;
		margin-right: 10px;
	}

	.task-name {
		width: 160rpx;
		color: #000;
		margin-right: 200rpx;
		font-size: 10px;
	}

	.task-text {
		// width: 300rpx;
		font-size: 10px;
		margin-right: 10px;
	}

	.status {
		display: inline-flex;
		// gap: 4px;
		align-items: center;

		.icon {
			margin: 0;
			/* 清掉默认外边距 */
			padding: 0;
			// line-height: 1;
			/* 避免撑开 */
			margin-right: 4px;
			/* 自己控制间距 */
		}
	}

	.weld-task.done .task-text {
		color: #000;
	}

	.weld-task.in_progress .task-text {
		color: #1e90ff;
		font-weight: bold;
	}

	.weld-task.waiting .task-text {
		color: #999;
	}

	.weld-task.error .task-text {
		color: #ff4d4f;
		font-weight: bold;
	}

	.current-task .task-name {
		color: #1e90ff;
		font-weight: bold;
	}

	.left-box {
		width: 300rpx;
		height: 500rpx;
		flex: 1;
	}

	.title {
		font-weight: bold;
	}

	.row {
		display: flex;
		padding: 8px 0;
	}

	.row>div {
		flex: 1;
	}

	.finished-btn {
		width: 80%;
		margin: 0 auto;
		margin-bottom: 60rpx;
	}
</style>
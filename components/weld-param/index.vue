<template>
	<view>
		<tip-card title="工艺包参数设置" :class="{ 'highlight-border': isParamSet }">
			<view v-if="weldParamList.length > 0" class="form-container">
				<uni-forms :modelValue="formData">
					<uni-forms-item label="工艺包名称" label-width="350rpx">
						<uni-data-select v-model="weldParam" :localdata="weldParamList" class="disabled-input uni-input"
							@change="change"></uni-data-select>
					</uni-forms-item>
					<uni-forms-item label="焊枪摆幅（mm）" label-width="350rpx">
						<uni-easyinput type="text" disabled v-model="formData.amplitude"
							class="disabled-input uni-input" />
					</uni-forms-item>

					<uni-forms-item label="焊机电流（A）" label-width="350rpx">
						<uni-easyinput type="text" disabled v-model="formData.electric"
							class="disabled-input uni-input" />
					</uni-forms-item>

					<uni-forms-item label="焊枪行进速度（mm/s）" label-width="350rpx">
						<uni-easyinput type="text" disabled v-model="formData.speed" class="disabled-input uni-input" />
					</uni-forms-item>

					<uni-forms-item label="焊机弧长校正电压（V）" label-width="350rpx">
						<uni-easyinput type="text" disabled v-model="formData.voltage"
							class="disabled-input uni-input" />
					</uni-forms-item>
				</uni-forms>
			</view>

			<view v-else class="add-param" @click="handleOpenDialog">
				<uni-icons type="redo-filled" class="add-content" color="#409EFF"></uni-icons><text
					class="add-text add-content">新增工艺包配置</text>
			</view>

		</tip-card>
		<!-- 弹框 -->
		<uni-popup ref="popup" type="center" @change="changeDialog">
			<view class="popup-box">
				<view class="popup-title">新增工艺包 <uni-icons style="float: right;" type="closeempty" color="#909399"
						size="18" @click="closePopup"></uni-icons></view>

				<!-- 表单 -->
				<uni-forms :modelValue="newForm" ref="addForm" label-width="350rpx" :rules="rules">
					<uni-forms-item label="工艺包名称" name="name" required>
						<uni-easyinput v-model="newForm.name" placeholder="请输入工艺包名称" />
					</uni-forms-item>
					<uni-forms-item label="焊枪摆幅（mm）" name="amplitude" required>
						<uni-easyinput type="number" v-model="newForm.amplitude" placeholder="请输入摆幅" />
					</uni-forms-item>
					<uni-forms-item label="焊机电流（A）" name="electric" required>
						<uni-easyinput type="number" v-model="newForm.electric" placeholder="请输入电流" />
					</uni-forms-item>
					<uni-forms-item label="焊枪行进速度（mm/s）" name="speed" required>
						<uni-easyinput type="number" v-model="newForm.speed" placeholder="请输入速度" />
					</uni-forms-item>
					<uni-forms-item label="焊机弧长校正电压（V）" name="voltage" required>
						<uni-easyinput type="number" v-model="newForm.voltage" placeholder="请输入电压" />
					</uni-forms-item>
				</uni-forms>
				<!-- 按钮 -->
				<view class="popup-footer">
					<button size="mini" class="btn" type="primary" @click="submitForm">
						确认
					</button>
					<button size="mini" class="btn" @click="closePopup">取消</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	import TipCard from "@/components/tip-card/index.vue";
	export default {
		components: {
			TipCard,
		},
		computed: {
			selectOptions() {
				if (this.weldParamList && this.weldParamList.length > 0) {
					// 在原有列表基础上加一个“增加工艺包”项
					const list = this.modifyData(this.weldParamList) || [];
					return [
						...list,
						{
							value: 'add',
							text: '增加工艺包'
						}
					];
				}
				return [];
			},
			isParamSet(){
				return this.$task.isParamSet
			}
		},
		data() {
			return {
				weldParamList: [],
				weldParam: 1, // 默认选中第一个工艺包的 value
				formData: {
					amplitude: "",
					electric: "",
					speed: "",
					voltage: "",
				},
				newForm: {
					name: "",
					amplitude: "",
					electric: "",
					speed: "",
					voltage: "",
				},
				rules: {
					name: {
						rules: [{
								required: true,
								errorMessage: "请输入工艺包名称",
							},
							{
								pattern: /^[^\s]{2,20}$/,
								errorMessage: "长度需为 2~20 个字符，且不能包含空格",
							},
						],
					},
					amplitude: {
						rules: [{
								required: true,
								errorMessage: "请输入焊枪摆幅"
							},
							{
								// 0 ~ 3 的整数
								pattern: /^(?:[0-2]|3)$/,
								errorMessage: "请输入正确的整数(0-3)",
							},
						],
					},
					electric: {
						rules: [{
								required: true,
								errorMessage: "请输入焊机电流"
							},
							{
								// 0 ~ 500 的整数
								pattern: /^(?:[0-9]|[1-9]\d|[1-4]\d\d|500)$/,
								errorMessage: "请输入正确的整数 (0-500)",
							},
						],
					},
					speed: {
						rules: [{
								required: true,
								errorMessage: "请输入焊枪行进速度"
							},
							{
								// 0 ~ 100 的整数
								pattern: /^(?:[0-9]|[1-9]\d|100)$/,
								errorMessage: "请输入正确的整数 (0-100)",
							},
						],
					},
					voltage: {
						rules: [{
								required: true,
								errorMessage: "请输入焊机弧长校正电压"
							},
							{
								// -5 ~ +5 的整数
								pattern: /^-?(?:[0-4]|5)$/,
								errorMessage: "请输入正确的整数 (-5 ~ +5)",
							},
						],
					}
				}
			};
		},
		mounted() {
			this.getWeldParamList();
		},
		methods: {
			change(value) {
				// console.log(value);
				if (value === 'add') {
					// 调用新增工艺包逻辑
					setTimeout(() => {
						this.handleOpenDialog();
					}, 100);
					return;
				}
				const selected = this.weldParamList.find((item) => item.value === value);
				if (selected) {
					this.formData.amplitude = selected.amplitude;
					this.formData.electric = selected.electric;
					this.formData.speed = selected.speed;
					this.formData.voltage = selected.voltage;
				} else {
					this.formData = {
						amplitude: "",
						electric: "",
						speed: "",
						voltage: "",
					};
				}
				this.$emit("handleChange", selected);
			},
			getWeldParamList() {

				this.$sql.getAllWeldParams().then(res => {
					this.weldParamList = this.modifyData(res) || [];
					this.weldParam = this.weldParamList[0].value;
					this.change(this.weldParam);
				}).catch(err => { //查询出来没数据也会报错

				})
			},
			handleOpenDialog() {
				this.$refs.popup.open();
			},
			submitForm() {
				// 简单校验
				this.$refs.addForm
					.validate()
					.then(() => {
						this.$sql.addWeldParam(this.newForm).then(() => {
							uni.showToast({
								title: "添加工艺包参数成功",
								icon: "success", // success / none / loading / error (部分平台不支持 error)
								duration: 1500,
							});
							this.getWeldParamList();
							this.closePopup();
						}).catch(err => {
							uni.showToast({
								title: "添加工艺包参数失败：" + err.message,
								icon: "error", // success / none / loading / error (部分平台不支持 error)
								duration: 1500,
							});
						})
					})
					.catch((e) => {

					});
			},
			closePopup() {
				this.$refs.popup.close();
			},
			changeDialog(e) {
				if (!e.show) {
					this.newForm = {
						name: "",
						amplitude: "",
						electric: "",
						speed: "",
						voltage: "",
					};
				}
			},
			modifyData(data) {
				if (data && data.length > 0) {
					data.forEach((item, index) => {
						item.value = index;
						item.text = item.name;
					});
					data.push({
						value: 'add',
						text: '增加工艺包',
						isAddOption: true
					});

					return data;
				}
				return [];

			}
		},
	};
</script>

<style scoped>
	.form-container {
		/* background-color: #fff; */
		/* padding: 20rpx; */
		/* margin: 20rpx; */
		/* border-radius: 16rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05); */
	}

	.uni-forms-item {
		margin-bottom: 10rpx;
	}

/* 	.uni-forms-item:last-child {
		margin-bottom: 0;
	} */

	.uni-data-select /deep/ .uni-select__input-text {
		color: #333;
	}

	/deep/ .uni-select__selector-item:last-of-type {
		color: #409EFF;
		text-decoration: underline;
	}


	.disabled-input {
		background-color: #f5f5f5;
		color: #666;
	}

	.add-param {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		/* 垂直居中 */
		justify-content: center;
		margin: 10px 0 10px 0;
	}

	.add-text {
		font-size: 28rpx;
		text-decoration: underline;
		/* 添加下划线 */
		/* color: black; */
	}

	.add-content {
		color: #409EFF;
		margin: 0 4px;
	}

	.uni-popup {
		z-index: 9999 !important;
	}

	.popup-box {
		background: #fff;
		border-radius: 8px;
		padding: 40rpx;
		width: 800rpx;
	}

	.popup-title {
		font-size: 32rpx;
		font-weight: bold;
		margin-bottom: 40rpx;
		color: black;
	}

	.popup-footer {
		/* display: flex;
		justify-content: flex-end; */
		align-items: center;
		overflow: hidden;
		margin-top: 40rpx;
		/* 按钮间距，可选 */
	}

	.popup-footer .btn {
		float: right;
		margin-left: 40rpx;
		box-sizing: border-box;
	}

	::v-deep .uni-forms-item {
		margin-bottom: 20rpx;
		/* 你想要的上下间距 */
	}

	.highlight-border {
		--y: #ffd84d;
		/* 主色：柔黄 */
		border: 5rpx solid var(--y);
		border-radius: 8rpx;
		animation: flashYellow 2.4s ease-in-out infinite;
	}

	@keyframes flashYellow {

		0%,
		100% {
			filter: drop-shadow(0 0 0 rgba(255, 216, 77, 0));
		}

		50% {
			filter: drop-shadow(0 0 6px rgba(255, 216, 77, 0.8));
		}
	}
</style>
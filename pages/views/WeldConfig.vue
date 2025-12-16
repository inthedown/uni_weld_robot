<template>
	<view class="container">
		<view class="header">
			<button class="btn-primary" size="mini" type="primary" @click="handleOpenDialog">新增</button>
		</view>
		<view class="main">
			<view class="process-package-table">
				<scroll-view scroll-y class="card-list">
				      <WeldParamCard
				        v-for="(pkg, index) in weldParamList"
				        :key="pkg.uuid"
				        :pkg="pkg"
				        :index="index"
				        @edit="editPackage"
				        @delete="deletePackage"
				      />
				    </scroll-view>
				
				
				<!-- 弹框 -->
				<uni-popup ref="popup" type="center" @change="changeDialog">
					<view class="popup-box">
						<view class="popup-title">新增工艺包 <uni-icons style="float: right;" type="closeempty"
								color="#909399" size="18" @click="closePopup"></uni-icons> </view>

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

				<!-- 弹框 -->
				<uni-popup ref="editPopup" type="center" @change="changeDialog">
					<view class="popup-box">
						<view class="popup-title">修改工艺包 <uni-icons style="float: right;" type="closeempty"
								color="#909399" size="18" @click="closePopup"></uni-icons></view>

						<!-- 表单 -->
						<uni-forms :modelValue="editForm" ref="editForm" label-width="350rpx" :rules="rules">
							<uni-forms-item label="工艺包名称" name="name" required>
								<uni-easyinput v-model="editForm.name" placeholder="请输入工艺包名称" />
							</uni-forms-item>
							<uni-forms-item label="焊枪摆幅（mm）" name="amplitude" required>
								<uni-easyinput type="number" v-model="editForm.amplitude" placeholder="请输入摆幅" />
							</uni-forms-item>
							<uni-forms-item label="焊机电流（A）" name="electric" required>
								<uni-easyinput type="number" v-model="editForm.electric" placeholder="请输入电流" />
							</uni-forms-item>
							<uni-forms-item label="焊枪行进速度（mm/s）" name="speed" required>
								<uni-easyinput type="number" v-model="editForm.speed" placeholder="请输入速度" />
							</uni-forms-item>
							<uni-forms-item label="焊机弧长校正电压（V）" name="voltage" required>
								<uni-easyinput type="number" v-model="editForm.voltage" placeholder="请输入电压" />
							</uni-forms-item>
						</uni-forms>
						<!-- 按钮 -->
						<view class="popup-footer">
							<button size="mini" class="btn" type="primary" @click="submitEditForm">
								确认
							</button>
							<button size="mini" class="btn" @click="closePopup">取消</button>
						</view>
					</view>
				</uni-popup>
			</view>
		</view>
	</view>
</template>

<script>
	import WeldParamCard from "@/components/weld-param-card/index.vue"

	export default {
		name: "weld-config",
		 components: { WeldParamCard },
		data() {
			return {
				weldParamList: [],
				newForm: {
					name: "",
					amplitude: "",
					electric: "",
					speed: "",
					voltage: "",
				},
				editForm: {
					uuid: "",
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
								minLength: 2,
								maxLength: 16,
								errorMessage: "长度在 2 到 20 个字符",
							},
							{
							      pattern: /^[^\s]{2,16}$/,
							      message: '请输入16位且不能包含空格',
							      trigger: 'blur'
							    }
						],
					},
					amplitude: {
						rules: [{
								required: true,
								errorMessage: "请输入焊枪摆幅"
							},
							{
								// 0 ~ 3 的整数或小数
								pattern: /^(?:[0-2]|3)$/,
								errorMessage: "请输入正确的数值(0-3)",
							},
						],
					},
					electric: {
						rules: [{
								required: true,
								errorMessage: "请输入焊机电流"
							},
							{
								// 0 ~ 500 的整数或小数
								pattern: /^(?:[0-9]|[1-9]\d|[1-4]\d\d|500)$/,
								errorMessage: "请输入正确的数值(0-500)",
							},
						],
					},
					speed: {
						rules: [{
								required: true,
								errorMessage: "请输入焊枪行进速度"
							},
							{
								// 0 ~ 100 的整数或小数
								pattern:/^(?:[0-9]|[1-9]\d|100)$/,
								errorMessage: "请输入正确的数值(0-100)",
							},
						],
					},
					voltage: {
						rules: [{
								required: true,
								errorMessage: "请输入焊机弧长校正电压"
							},
							{
								// -5 ~ +5 的整数或小数
								pattern: /^-?(?:[0-4]|5)$/,
								errorMessage: "请输入正确的数值(-5 ~ +5)",
							},
						],
					}
				}
			}
		},
		mounted() {
			this.getWeldParamList();
		},
		methods: {
			back() {

			},
			editPackage(pkg) {
				this.editForm = pkg;
				this.$refs.editPopup.open();
			},
			deletePackage(pkg) {
				uni.showModal({
					title: '提示',
					content: '确定要删除这个工艺包吗？',
					confirmText: '取消',
					cancelText: '确定',
					success: (res => {
						if (res.confirm) {

						} else if (res.cancel) {
							this.$sql.deleteParam(pkg).then(() => {
								uni.showToast({
									title: '删除成功',
									icon: 'success',
									duration: 2000
								});
								this.getWeldParamList();
							}).catch(err => {
								uni.showToast({
									title: '删除失败' + err.message,
									icon: 'error',
									duration: 2000
								});
							});
						}
					})
				});

			},
			getWeldParamList() {
				this.$sql.getAllWeldParams().then(res => {
					this.weldParamList = res;
				}).catch(err => {
					console.log('获取列表失败', err.message);
					uni.showToast({
						title: '获取列表失败',
						icon: 'error',
						duration: 2000
					});
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
			submitEditForm() {
				// 简单校验
				this.$refs.editForm
					.validate()
					.then(() => {
						this.$sql.updateWeldParam(this.editForm).then(() => {
							uni.showToast({
								title: "修改工艺包参数成功",
								icon: "success", // success / none / loading / error (部分平台不支持 error)
								duration: 1500,
							});
							this.getWeldParamList();
							this.closePopup();
						}).catch(err => {
							uni.showToast({
								title: "修改工艺包参数失败：" + err.message,
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
				this.$refs.editPopup.close();
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

		}
	}
</script>

<style scoped>
	.container {
		width: 100%;
		height: 100%;
		background-color: #fff;
	}

	.header {
		display: inline-flex;
		flex-direction: row;
		/* 横向排列 */
		justify-content: flex-start;
		/* 水平靠左 */
		align-items: center;
		/* 按钮间距 */
		padding: 10rpx 0;
		padding: 20rpx 20rpx;
	}

	.btn-info {
		margin-right: 20rpx;

	}

	.btn-primary {
		/* background-color: #007aff;
		/* primary 样式 
		color: #fff;
		font-size: 12px;
		border-radius: 4px; */
	}

	.main {
		padding: 20rpx 20rpx;
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

		/* 按钮间距，可选 */
	}

	.popup-footer .btn {
		float: right;
		margin-left: 40rpx;
		box-sizing: border-box;
	}

	::v-deep .uni-forms-item {
		margin-bottom: 40rpx;
		/* 你想要的上下间距 */
	}

	.btn {
		margin-right: 20rpx;

	}
	.card-list {
	  max-height: 900rpx;
	  min-height: 500rpx;
	}
</style>
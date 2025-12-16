<template>

	<view class="">
		<!-- 可移动区域容器 -->
		<movable-area class="movarea" ref="areaBox" id="areaBox">
			<!-- 这块只是循环出固定内容，监听其元素touch事件获取坐标  -->
			<view class="appList">
				<view class="app-li text-blue" v-for="(appItem, index) in listData_c" :key="appItem.appId"
					:id="'appLi' + index" :class="hoverClass === 'appLi' + index ? 'select' : ''"
					@touchstart="AppLi_touchstart(index, $event)"  @touchmove="AppLi_touchmove"
					@touchend="AppLi_touchend(index)">
					<image class="drag-icon" :src="`${appItem.marked_image}`" mode="widthFix" />
					<text class="appName"> {{ appItem.name }}</text>
					<uni-icons type="clear" color="red" class="appicon cuIcon-roundclosefill"
						:class="deleteAppID === appItem.appId && showDelete ? '' : 'hide'"
						@tap="deleteAppItem(index)"></uni-icons>
				</view>

				<!-- 	<view class="app-li text-blue" @tap="addAppItem">
					<text class="appicon cuIcon-roundadd"></text>
				</view> -->
			</view>
			<!-- 滑块 -->
			<movable-view v-if="moviewShow" :animation="true" class="moveV text-blue" :x="moveX" :y="moveY"
				direction="all" :style="{ width: moveViewSize + 'px', height: 160 + 'rpx' }">
				<text :class="['appIcon', touchItem.appIcon]"></text>
				<text class="appName">{{ touchItem.appName }}</text>
			</movable-view>
		</movable-area>
		<!-- 图片预览弹框 -->
		<!-- <uni-popup
      ref="imgPreview"
      type="center"
      background-color="rgba(0,0,0,0.8)"
	    :mask-click="false"
    >
	<view class="preview-container">

      <view class="preview-header">
        <text class="preview-title">图片预览</text>
        <view class="close-btn" @click="closePreview">
          <uni-icons type="closeempty"  size="30" color="#000000"></uni-icons>
        </view>
      </view>

      <view class="preview-body">
        <image class="preview-img" :src="imgSrc" mode="widthFix" />
      </view>
    </view>
    </uni-popup> -->
	</view>
</template>

<script>
	export default {
		name: "AppList",
		props: {
			listData: {
				type: Array,
				default: () => {
					return [];
				},
			},
		},
		data() {
			return {
				listData_c: this.listData, //缓存props，(不建议直接修改props)
				// CheckAppId: null,
				deleteAppID: null, //触发删除的itemID
				showDelete: false, //删除按钮状态
				IsDeleteAfter: false, //是否为删除后
				IsCancelDelete: false, //是否为取消后
				moviewShow: false, //滑块状态
				areaBoxInfo: null, //保存滑动区域盒子dom信息
				inBoxXY: {}, //鼠标在item中的坐标
				touchIndex: 0, //被移动index
				touchItem: "", //备份被移动item数据
				moveX: 0, //相对滑动盒子的坐标
				moveY: 0, //相对滑动盒子的坐标
				hoverClass: "",
				hoverClassIndex: null, //最终index
				imgSrc: null
			};
		},
		watch: {
			listData_c(val) {
				console.log('val', val);
				this.$emit("listChange", val);
			},
		},
		computed: {
			moveViewSize() {
				if (this.areaBoxInfo && this.areaBoxInfo.width) {
					return this.areaBoxInfo.width / 5;
				} else {
					return 0;
				}
			},
		},
		mounted() {
			// 获取dom信息
			this.resetListDom();
		},
		methods: {
			getDomInfo(id, callBack) {
				const query = uni.createSelectorQuery().in(this);
				query
					.select("#" + id)
					.boundingClientRect()
					.exec(function(res) {
						callBack(res[0]);
					});
			},
			// 添加
			addAppItem() {
				this.$refs.addAppItem.ModalStatus();
			},
			confirm() {
				let appItem = {
					appId: this.listData_c.length + 1,
					appIcon: "cuIcon-pic",
					appName: this.$refs.addAppInput.value,
					appLink: "",
				};
				this.listData_c.push(appItem);
				this.$refs.addAppInput.resetVal();
				this.$nextTick(() => {
					this.resetListDom();
				});
			},
			AppLi_touchstart(index, event) {
				this.touchItem = this.listData_c[index];
				console.log(this.touchItem.appId);
				this.$task.currentWeld=this.touchItem;
				// 行为判断
				if (this.showDelete) {
					// 取消删除
					if (this.touchItem.appId != this.deleteAppID) {
						this.deleteAppID = null;
						this.showDelete = false;
						this.IsCancelDelete = true;
					}
					// 删除
					if (this.touchItem.appId == this.deleteAppID) {
						// this.deleteAppItem(index);
					}
				}
				// 过时触发（touchEnd中清除此定时器）
				this.Loop = setTimeout(() => {
					// 触感反馈（安卓上是150毫秒，ios无短触控反馈）
					uni.vibrateShort();
					this.showDelete = true;
					this.deleteAppID = this.touchItem.appId;
					// 拖动逻辑
					//显示可移动方块
					// this.moviewShow = true;
					// //保存当前所选择的索引
					// this.touchIndex = index;
					// // 设置可移动方块的初始位置为当前所选中图片的位置坐标
					// this.moveX = this.listData_c[index].x;
					// this.moveY = this.listData_c[index].y;
					// var x = event.changedTouches[0].clientX - this.areaBoxInfo.left;
					// var y = event.changedTouches[0].clientY - this.areaBoxInfo.top;
					// // 保存鼠标在图片内的坐标
					// this.inBoxXY = {
					// 	x: x - this.listData_c[index].x,
					// 	y: y - this.listData_c[index].y,
					// };
				}, 100);
			},
			AppLi_touchmove(event) {
				// 每次endTouch清除startTouch删除按钮定时器
				if (this.Loop) {
					clearTimeout(this.Loop);
					this.Loop = null;
				}
				if (this.showDelete) {
					// // console.log(this.areaBoxInfo);
					// let areaBoxTop = this.areaBoxInfo.top;
					// let areaBoxLeft = this.areaBoxInfo.left;
					// //重置为以拖拽盒子左上角为坐标原点
					// var x = event.changedTouches[0].clientX - areaBoxLeft;
					// var y = event.changedTouches[0].clientY - areaBoxTop;
					// this.moveX = x - this.inBoxXY.x;
					// this.moveY = y - this.inBoxXY.y;

					// let setIng = false;
					// this.listData_c.forEach((item, idx) => {
					// 	if (x > item.x && x < item.x + 80 && y > item.y && y < item.y + 80) {
					// 		this.hoverClass = "appLi" + idx;
					// 		this.hoverClassIndex = idx;
					// 		setIng = true;
					// 	}
					// });
					// // 都不存在代表脱离
					// if (!setIng) {
					// 	this.hoverClass = "";
					// 	this.hoverClassIndex = null;
					// }
				}
			},
			AppLi_touchend(index) {
				if (!this.showDelete && !this.IsDeleteAfter && !this.IsCancelDelete) {
					this.$emit('showImage', this.touchItem);
				} else {
					// 为下次getInto清除状态
					this.IsDeleteAfter = false;
					this.IsCancelDelete = false;
					// 移动结束隐藏可移动方块
					if (
						this.hoverClassIndex != null &&
						this.touchIndex != this.hoverClassIndex
					) {
						this.$set(
							this.listData_c,
							this.touchIndex,
							this.listData_c[this.hoverClassIndex]
						);
						this.$set(this.listData_c, this.hoverClassIndex, this.touchItem);
						this.showDelete = false;
						this.resetListDom();
					}
					this.touchItem = "";
					this.moviewShow = false;
					this.hoverClass = "";
					this.hoverClassIndex = null;
				}
				// 每次endTouch清除startTouch删除按钮定时器
				if (this.Loop) {
					clearTimeout(this.Loop);
					this.Loop = null;
				}
			},
			deleteAppItem(index) {
				this.listData_c.splice(index, 1);
				this.showDelete = false;
				this.checkIndex = null;
				this.IsDeleteAfter = true;
				this.resetListDom();
			},
			getInto() {
				this.$refs.imgPreview.open();

			},
			resetListDom() {
				let _this = this;
				this.getDomInfo("areaBox", (info) => {
					_this.areaBoxInfo = info;
					// 设置区域内所有图片的左上角坐标
					_this.listData_c.forEach((item, idx) => {
						_this.getDomInfo("appLi" + idx, (res) => {
							item.x = res.left - info.left;
							item.y = res.top - info.top;
						});
					});
				});
			},
			boxClick() {
				this.deleteAppID = null;
				this.showDelete = false;
			},
			openPreview() {
				this.$refs.imgPreview.open()
			},
			closePreview() {
				this.$refs.imgPreview.close()
			}
		},
	};
</script>

<style lang="scss">
	.movarea {
		width: 100%;
		height: auto;
	}

	.appList {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		// border: 2px dashed blue; // 整个列表边框
	}

	.app-li {
		flex: 1 0 25%;
		max-width: 25%;
		box-sizing: border-box;

		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center; // 水平居中
		justify-content: center; // 垂直居中
		padding: 10rpx;
		position: relative;

		// border: 1px solid red; // 每个 item 边框
		// background: rgba(255, 0, 0, 0.05); // 微红背景方便看

		.appIcon {
			font-size: 60rpx;
			color: red;
		}

		.appName {
			font-size: 24rpx;
			color: #000000;
			// border: 1px dotted purple; // 文字边框
			// background: rgba(128, 0, 128, 0.1);
		}

		.cuIcon-roundadd {
			font-size: 60rpx;
			color: #cccccc;
		}

		.cuIcon-roundclosefill {
			position: absolute;
			top: -6rpx;
			right: -6rpx;
			font-size: 180rpx;
			z-index: 2;

			&.hide {
				display: none;
			}
		}
	}

	.moveV {
		opacity: 0.8;
		z-index: 999;
		width: 100rpx;
		height: 160rpx;
		box-sizing: border-box;
		text-align: center;
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		padding: 20rpx;

		.appIcon {
			font-size: 60rpx;
		}

		.appName {
			font-size: 24rpx;
		}
	}

	.select {
		// transform: scale(1.3);
		border-radius: 16rpx;
		border: 1px dashed #c0c0c0;
		color: #c0c0c0;
	}

	.drag-icon {
		width: 100%;
		max-height: 100rpx; // 限制格子高度
		object-fit: contain;
		// border: 1px dashed green; // 图片边框
		// background: rgba(0, 255, 0, 0.1);
	}

	.preview-container {
		width: 60%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		background: rgba(255, 255, 255, 1);
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx;
		border-bottom: 1px solid rgba(255, 255, 255, 0.3);
	}

	.preview-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #000000;
	}

	.preview-body {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 20rpx;
	}

	.preview-img {
		max-width: 100%;
		max-height: 70vh;
		object-fit: contain;
	}
</style>
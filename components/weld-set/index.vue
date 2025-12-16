<template>
	<view>
		<tip-card title="焊缝列表">
			<view class="content">
				<view class="tip-text">
					<text style="font-size: 10px;">点击图标可编辑，长按可删除</text>
				</view>
				<view class="weld-set-box">
					<AppList class="app-list" :listData="weldList" @listChange="listChange"
						@showImage="handleShowImage"></AppList>
				</view>
				<!-- <view ref="trash" class="trash-bin">
          <uni-icons type="trash-filled" color="#ff4d4f" size="40" />
          <text>拖到这里删除</text>
        </view> -->
			</view>
		</tip-card>
	</view>
</template>

<script>
	import TipCard from "@/components/tip-card/index.vue";
	import BasicDrag from "@/components/basic-drag/index.vue";
	import AppList from "@/components/healer-dragList/AppList.vue";
	export default {
		components: {
			TipCard,
			BasicDrag,
			AppList,
		},
		computed: {
			weldList() {
				// console.log('this.$task.weldList',this.$task.weldList)
				return this.$task.weldList
			}
		},
		data() {
			return {
				dragIndex: null, // 被拖拽的元素索引

			};
		},
		mounted() {},
		methods: {
			listChange(list) {
				console.log("listChange", list);
				//返回给父组件
				this.$emit("listChange", list);
			},
			handleShowImage(item) {
				this.$task.currentWeld = item;
			}
		},
	};
</script>
<style scoped>
	.content {
		width: 100%;
	}

	.tip-text {
		font-size: 10px;
		color: #666;
		margin-bottom: 10rpx;
	}

	.weld-set-box {
		width: 100%;
		min-height: 200rpx;
		max-height: 300rpx;
		overflow-y: auto;
		overflow-x: hidden;
		box-sizing: border-box;
		padding: 0 10px 0 10px;
	}

	.weld-set-item {
		/* width: 80px;
  height: 100px;
  position: absolute;
  user-select: none;
  text-align: center; */
	}

	.drag-icon {
		width: 60rpx;
		height: 60rpx;
		margin: 0 auto;
		display: block;
		background: #eee;
	}

	.item-text {
		margin-top: 5px;
		font-size: 12px;
	}

	.trash-bin {
		width: 100px;
		height: 80px;
		border: 2px dashed #ff4d4f;
		border-radius: 8px;
		text-align: center;
		line-height: 40px;
		color: #ff4d4f;
		margin: 0 auto;
	}

	.app-list {
		width: 100%;
		height: 100%;
		margin-top: 5px;
		overflow-y: auto;
		overflow-x: hidden;
	}
</style>
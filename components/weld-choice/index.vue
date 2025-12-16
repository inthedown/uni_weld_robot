<template>
	<view>
		<tip-card title="焊缝类型选择">
			<view class="radio-group-column">
				<radio-group @change="onRadioChange">
					<label v-for="(item, index) in options" :key="index" class="radio-item">
						<radio :value="item.value" :checked="item.value === selectedValue"  class="custom-radio" />
						<text class="radio-label">{{ item.label }}</text>
					</label>
				</radio-group>
			</view>
		</tip-card>
	</view>
</template>

<script>
	import tipCard from '@/components/tip-card/index.vue'
	export default {
		components: {
			tipCard
		},
		data() {
			return {
				selectedValue: '', // 当前选中项的值
				options: [{
						label: '角焊缝',
						value: '1'
					},
					{
						label: '平焊缝',
						value: '0'
					},
					{
						label: '圆形焊缝',
						value: '2'
					}
				]
			}
		},
		methods: {
			onRadioChange(e) {
				this.selectedValue = e.detail.value;
				this.$emit('updateWeldClass',this.selectedValue);
			}
		}
	}
</script>

<style>
	.radio-group-column {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		
	}

	.radio-item {
		display: flex;
		 align-items: center;  // 垂直居中
		  margin-bottom: 10rpx; // 每个单项间距
		  gap: 5rpx;            // radio 与文字间距
	}

	.radio-label {
		
		font-size: 24rpx;
		color: #333;
	}
	.custom-radio {
	  transform: scale(0.8); /* 比例缩放，可改为 0.6、0.7 等 */
	}
</style>
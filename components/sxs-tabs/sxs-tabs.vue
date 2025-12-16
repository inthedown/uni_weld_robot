<template>
	<view class='tabs-container'>
		<scroll-view
			id="scrollContainer"
			:scroll-x="scroll" 
			:scroll-with-animation='scroll'
			:scroll-left='offsetLeft'
		>
			<view class='scroll-main'>
				<view 
					v-for='(item,index) in items'
					:key='index'
					class='tabs-item'
					:style='current==index?textStyle:""'
					@click='tabsClick(index,item)'
				>
					<text>{{ item.label }}</text>
				</view>
			</view>
			<view :style="lineStyle" class='tabs-line'></view>
		</scroll-view>
	</view>
</template>

<script>
export default{
	props:{
		selectedId:{
			type:[Number,String],
			default:0,
		},
		items:{
			type:Array,
			default(){ return []}
		},
		options:{
			type:Object,
			default(){ return {}}
		}
	},
	mounted(){
		//this.changeLine();
	},
	data () {
		return {
			lineWidth:0,
			lineLeft:0,
			scroll:true,
			offsetLeft:0,
			current:this.selectedId,
		}
	},
	computed:{
		textStyle(){
			return {
				color:this.options.color
			}
		},
		lineStyle(){
			return {
				width: `${this.lineWidth}rpx`,
				left: `${this.lineLeft}px`,
				transform:`translateX(50%)`,
				background:this.options.color
			}
		}
	},
	mounted(){
		this.changeLine();
	},
	methods:{
		//计算line位置和大小
		changeLine(){
			let query = uni
			  .createSelectorQuery()
			  // #ifndef MP-ALIPAY
			  .in(this)
			// #endif
			// 获取容器的宽度
			query
			  .select(`#scrollContainer`)
			  .boundingClientRect((data) => {
			    if (!this.containerWidth && data) {
			      this.containerWidth = data.width;
			    }
			  })
			  .exec()
			//获取所有的 tab-item 的宽度
			query
			  .selectAll('.tabs-item')
			  .boundingClientRect((data) => {
			    if (!data) {
			      return
			    }
				const target = data[this.current];
				this.lineWidth = target.width;
				this.lineLeft = target.left;
			  })
			.exec()
		},
		//点击tabs
		tabsClick( index , item  ){
			this.current = index;
			let query = uni
			  .createSelectorQuery()
			  // #ifndef MP-ALIPAY
			  .in(this)
			// #endif
			query
			  .select(`#scrollContainer`)
			  .boundingClientRect((data) => {
			    if (!this.containerWidth && data) {
			      this.containerWidth = data.width;
			    }
			  })
			  .exec()
			query
			  .selectAll('.tabs-item')
			  .boundingClientRect((data) => {
			    if (!data) {
			      return
			    }
			    let lineLeft = 0
			    let currentWidth = 0
			    if (data) {
			      for (let i = 0; i < data.length; i++) {
			        if (i < this.current) {
			          lineLeft += data[i].width;
			        } else if (i == this.current) {
			          currentWidth = data[i].width
			        } else {
			          break
			        }
			      }
			    }
				this.lineLeft = lineLeft;
			    this.currentWidth = currentWidth
			    let oLeft = lineLeft + currentWidth / 2;
			    if (this.scroll) {
			      this.offsetLeft = oLeft - this.containerWidth / 2;
			    }
			  })
			.exec()
			this.$emit('change',{index,item});
		}
	}
}
</script>

<style>
.tabs-container{
	position: relative;
	width: 100%;
	white-space: nowrap;
}
.scroll-main{
	position: relative;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	width: 100%;
}
/deep/ .uni-scroll-view::-webkit-scrollbar{
	display:none;
}
.tabs-item{
	padding:15rpx 30rpx;
	color: black;
}
#scrollContainer{
	position: relative;
}
.tabs-line{
	content: '';
	position: absolute;
	left:0;
	bottom:0;
	height: 4rpx;
	transition: all 300ms,
}
</style>
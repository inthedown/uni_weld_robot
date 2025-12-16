<template>
	<view>
		<sxs-tabs :selectedId="selectedId" :items="items" :options="options" @change="handleChange"></sxs-tabs>
		<view class="content">
			<weld-config v-if="selectedId===0"></weld-config>
			<reset-arm v-if="selectedId===1"></reset-arm>
		</view>
	</view>
</template>

<script>
	import sxsTabs from '@/components/sxs-tabs/sxs-tabs.vue'
	import WeldConfig from '@/pages/views/WeldConfig.vue';
	import ResetArm from '@/components/reset-arm/index.vue'
	export default {
		components: {
			sxsTabs,
			WeldConfig,
			ResetArm
		},
		data() {
			return {
				selectedId: 0,
				items: [{
						label: '工艺包配置'
					},
					{
						label: '初始位姿'
					}
				],
				options: {
					color: "#007aff", //设置选中颜色
				}
			}
		},
		methods: {
			handleChange(e) {
				console.log(e)
				this.selectedId=e.index;
			}
		}
	}
</script>

<style>

</style>
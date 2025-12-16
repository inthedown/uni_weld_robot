<template>
	<view class="sidebar">
		<view v-for="item in menuList" :key="item.path" class="menu-item" :class="{ active: isActive(item.path) }"
			@click="navigate(item.path)">
			<uni-icons class="menu-icon" :type="item.icon" size="30"></uni-icons>
			<text class="menu-text">{{ item.name }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'SidebarMenu',
		data() {
			return {
				menuList: [{
						name: '主页',
						path: '/pages/views/Home',
						icon: 'home'
					},
					{
						name: '设置',
						path: '/pages/views/About',
						icon: 'gear'
					}
				],
				currentPath: ''
			};
		},
		 onShow() {
		    this.updateCurrentPath();
		  },
		 mounted() {
		    this.updateCurrentPath();
		  },
		methods: {
			 updateCurrentPath() {
			      const pages = getCurrentPages();
			      const current = pages[pages.length - 1];
			      this.currentPath = '/' + current.route;
			    },
			navigate(path) {
				if (this.currentPath !== path) {
					uni.navigateTo({
						url: path
					});
				}
			},
			isActive(path) {
				return this.currentPath === path;
			}

		}
	};
</script>

<style scoped>
	.sidebar {
		
		background-color: #ffffff;
		
		display: flex;
		flex-direction: column;
		align-items: center;
		border-right: 1rpx solid #3c3c3c;
	}

	.menu-item {
		width: 60rpx;
		margin-bottom: 40rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		color: #666;
		font-size: 24rpx;
		transition: color 0.3s;
	}

	.menu-item.active {
		color: #f9001d;
	}

	.menu-icon {
		width: 40rpx;
		height: 40rpx;
		margin-bottom: 10rpx;
	}

	.menu-text {
		text-align: center;
	}
</style>
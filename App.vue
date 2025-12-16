<script>
	import sql from '@/utils/sqlPlugin.js'
	export default {
		onLaunch: function() {
			console.log(uni.getStorageSync('device_ip'));
			console.log('App Launch');
			// 隐藏状态栏，仅在 app 端生效
			if (typeof plus !== 'undefined') {
				plus.navigator.closeSplashscreen();
			}
			if (typeof plus !== 'undefined') {
				// 判断有没有存储权限
				var _this = this
				plus.android.requestPermissions(['android.permission.WRITE_EXTERNAL_STORAGE'], function(e) {
					console.log(e.deniedPresent)
					if (e.deniedAlways.length > 0) { //权限被永久拒绝
						// 弹出提示框解释为何需要读写手机储存权限，引导用户打开设置页面开启
						uni.showModal({
							title: '存储权限',
							content: '您拒绝了存储权限，请去设置-应用开启存储权限。',
							success: function(res) {
								if (res.confirm) {

								} else if (res.cancel) {

								}
							}
						});
					}
					if (e.deniedPresent.length > 0) { //权限被临时拒绝
						// 弹出提示框解释为何需要读写手机储存权限，可再次调用plus.android.requestPermissions申请权限
						plus.android.requestPermissions(['android.permission.WRITE_EXTERNAL_STORAGE'])
					}
					if (e.granted.length > 0) { //权限被允许
						//调用依赖获取读写手机储存权限的代码
						// _this.upload() // 获取权限成功之后调用的函数

					}

				sql.initDatabase();
		
				}, function(e) {

				});
			}
			
		},
		onShow: function() {
			console.log('App Show')

		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
	uni-page-head {
		display: none;
	}
</style>
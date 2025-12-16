// request/request.js

// 添加拦截器
uni.addInterceptor('request', {
	invoke(args) {
		const defaultIp = uni.getStorageSync('device_ip') || '127.0.0.1:54321';
		let baseURL = `http://${defaultIp}`;
		// 检查是否传了 customIp
		const match = args.url.match(/^__USE_CUSTOM_IP__::(.*?)::(.*)$/);
		if (match) {
			const [, customIp, originalUrl] = match;
			baseURL = `http://${customIp}`;
			args.url = originalUrl;
		}

		// 如果是完整 URL，则不加 baseURL
		const isFullUrl = /^https?:\/\//.test(args.url) || /^(\d{1,3}\.){3}\d{1,3}:\d+/.test(args.url);
		if (!isFullUrl) {
			args.url = baseURL + args.url;
		}
		// console.log("url:", args.url);
		// console.log("data:", args.data);
		if (!JSON.stringify(args).includes("devices_status")) {
		    console.log("url:", args.url);
		    console.log("data:", args.data);
		}

		// 设置统一 headers
		args.header = {
			...args.header,
			'Content-Type': 'application/json',
			'Authorization': uni.getStorageSync('token') || ''
		};
	}
});


export default function request(url, options = {}) {
	// 仅当 options.customIp 存在时，做标记处理
	if (options.customIp) {
		url = '__USE_CUSTOM_IP__::' + options.customIp + '::' + url;
	}

	return new Promise((resolve, reject) => {
		// console.log('data',options.data);
		uni.request({
			url,
			timeout: 3000,
			...options,
			success: res => {
				if (res.data) {
					resolve(res.data)
				} else {
					resolve(res)
				}

			},
			fail: err => reject(err)
		});
	});
}
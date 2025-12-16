// logger.js
const logs = [];
let seen = null; // 用于检测循环引用
const logFile = '_doc/logs.txt';

function wrapConsoleMethod(type) {
	const orig = console[type];
	console[type] = (...args) => {
		try {

			// 确保 seen 每次都是新实例
			let seen = new WeakSet();

			// 确保 args 是数组
			const safeArgs = Array.isArray(args) ? args : [];

			// 安全 stringify
			const msg = safeArgs.map(arg => {
				if (arg instanceof Error) {
					return `Error: ${arg.message}\nStack: ${arg.stack}`;
				}
				try {
					return safeStringify(arg, seen);
				} catch (err) {
					return `[Unserializable: ${err.message}]`;
				}
			}).join(' ');
			// #ifdef APP
			// 存日志，安全保护
			try {
				logs.push({
					time: new Date().toISOString(),
					type,
					msg
				});
				plus.io.requestFileSystem(plus.io.PRIVATE_DOC, function(fs) {
					fs.root.getFile(logFile, {
						create: true
					}, function(fileEntry) {
						fileEntry.createWriter(function(writer) {
							writer.seek(writer.length); // 移动到文件末尾，做追加
							const content = `[${new Date().toISOString()}] ${msg} \n`;
							writer.write(content);

						}, function(e) {
							orig(`写入日志出错: ${e.message}`);
						});
					});
				});
				if (logs.length > 500) logs.shift();
			} catch (err) {
				orig(`日志缓存出错: ${err.message}`);
			}
			// #endif
		} catch (err) {
			// 捕获 wrap 内部的任何错误，不让它影响主流程
			orig(`wrapConsoleMethod 内部出错: ${err.message}`);
		}

		// 始终调用原始 console 方法
		try {
			orig.apply(console, args);
		} catch (err) {
			// 理论上这里不太会出错，但保险起见也捕获
		}
	};
}

// 一个安全 stringify 方法
function safeStringify(value, seen) {
	if (value === undefined) return 'undefined';
	if (typeof value === 'symbol') return value.toString();
	if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
	if (typeof value === 'object' && value !== null) {
		if (seen.has(value)) return '[Circular]';
		seen.add(value);
	}
	// 🔹 新增：Error 对象单独处理
	if (value instanceof Error) {
		return `Error: ${value.message}\nStack: ${value.stack}`;
	}

	return JSON.stringify(value, (_, val) => {
		if (typeof val === 'symbol') return val.toString();
		if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
		return val;
	});
}


// 拦截 log / error / warn
['log', 'error', 'warn'].forEach(wrapConsoleMethod);

export default {
	getLogs() {
		return logs;
	},
	clearLogs() {
		logs.length = 0;
	}
};
<template>

	<view class="camera-view">
		<view class="image" id="2dcanvas" ref="renderRef" :prop='renderCommand' :change:prop='renderRef.onRenderChange'>
		</view>
	</view>
</template>


<script module="renderRef" lang="renderjs">
	let canvas = null;
	let container = null;
	let canvasEl = null;
	let fabricObj = null;
	let currentLine = null;
	let lines = []; // 保存所有线段数据
	let drawingMode = false; // 是否处于绘制模式（由逻辑层下发命令切换）
	const strokeStyle = 'red';
	const strokeWidth = 3;
	let LOGIC_WIDTH, LOGIC_HEIGHT, displayWidth, displayHeight, dpr, left_display, top_display, scale_display;
	let isDrawing = false;
	let isMultiTouch = false;
	let _this = null; // 顶层保存模块实例
	let lastTouchDistance = 0; // 上次双指距离
	let lastTouchCenter = null; // 双指中心点
	let pendingDrawPoints = null; //待绘制线
	let backgroundReady = false; //背景状态
	let _editableLineEventsBound = false;
	let drawMode = false;

	function getPointerFromEvent(optOrEvent) {
		// optOrEvent 可能是 fabric 事件对象（opt），也可能是原生事件 e
		const e = optOrEvent && optOrEvent.e ? optOrEvent.e : optOrEvent;
		if (!e) return {
			x: 0,
			y: 0
		};

		// 获取鼠标或触摸位置
		let clientX, clientY;
		if (e.touches && e.touches.length > 0) {
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
		} else if (e.changedTouches && e.changedTouches.length > 0) {
			clientX = e.changedTouches[0].clientX;
			clientY = e.changedTouches[0].clientY;
		} else {
			clientX = e.clientX != null ? e.clientX : (e.pageX || 0);
			clientY = e.clientY != null ? e.clientY : (e.pageY || 0);
		}

		// 拿到 canvas DOM
		canvasEl = canvas && canvas.lowerCanvasEl ? canvas.lowerCanvasEl : canvas.upperCanvasEl;
		if (!canvasEl) return {
			x: clientX,
			y: clientY
		};

		// 画布在页面位置
		const rect = canvasEl.getBoundingClientRect();

		// 相对于 canvas 左上角
		let x = clientX - rect.left;
		let y = clientY - rect.top;

		// 转为 canvas 像素坐标（考虑画布实际 width/height）
		const actualWidth = canvasEl.width;
		const actualHeight = canvasEl.height;
		const cssWidth = rect.width;
		const cssHeight = rect.height;

		x = x * (actualWidth / cssWidth);
		y = y * (actualHeight / cssHeight);
		// ✅ 直接返回原始像素，不做 viewportTransform 或缩放处理
		return {
			x,
			y
		};
	}

	function convertLineToImagePixel(currentLine) {
		// 屏幕坐标 → 图像坐标
		const toImageX = (x) => (x - left_display) / scale_display;
		const toImageY = (y) => (y - top_display) / scale_display;

		return {
			x1: toImageX(currentLine.x1),
			y1: toImageY(currentLine.y1),
			x2: toImageX(currentLine.x2),
			y2: toImageY(currentLine.y2)
		};
	}

	function convertPointToImagePixel(point) {
		// 屏幕坐标 → 图像坐标
		const toImageX = (x) => (x - left_display) / scale_display;
		const toImageY = (y) => (y - top_display) / scale_display;

		return {
			x: toImageX(point.x1),
			y: toImageY(point.y1)
		};
	}

	function convertImagePixelToCanvasPoint(px, py) {
		return {
			x: px * scale_display + left_display,
			y: py * scale_display + top_display
		};
	}
	export default {
		mounted() {

			if (!window.fabric) {
				// 加载 fabric
				this.loadScript('static/libs/fabric.min.js', () => {
					this.initCanvas();
				})
			} else {
				this.initCanvas();
			}


		},
		methods: {
			initCanvas() {
				container = document.getElementById('2dcanvas');
				if (!container) return;

				// --- remove existing canvases to avoid duplicates ---
				const existing = container.querySelector('#fabricCanvas');
				if (existing) existing.remove();

				// create canvas element
				const canvasEl = document.createElement('canvas');
				canvasEl.id = 'fabricCanvas';
				// style size will be CSS pixels (display size)
				canvasEl.style.width = '100%';
				canvasEl.style.height = '100%';
				container.appendChild(canvasEl);

				// read container CSS size (display size in px)
				const cssWidth = Math.round(container.clientWidth);
				const cssHeight = Math.round(container.clientHeight);
				const ratio = window.devicePixelRatio || 1;

				// set actual drawing buffer size = css * ratio (high DPI)
				canvasEl.width = Math.max(1, cssWidth);
				canvasEl.height = Math.max(1, cssHeight);

				// keep CSS display size
				canvasEl.style.width = cssWidth + 'px';
				canvasEl.style.height = cssHeight + 'px';

				// init fabric, disable its builtin retina scaling (we handled it)
				canvas = new fabric.Canvas(canvasEl, {
					selection: false,
					enableRetinaScaling: true, // IMPORTANT: prevent double-scaling
					width: canvasEl.width,
					height: canvasEl.height
				});

				// ensure fabric knows layout offsets
				canvas.calcOffset && canvas.calcOffset();

				console.log('初始化2dcanvas')

				console.log('iFabric canvas 初始化成功');
				_this = this;
				// 开始绘制

				canvas.on('mouse:down', function(o) {
					const e = o.e;
					// === 判断是否是双指或多指 ===
					if (e.touches && e.touches.length > 1 && drawMode) {
						// 禁止画线，进入缩放/平移模式
						isMultiTouch = true;
						isDrawing = false;
						return;
					}
					isDrawing = true;

					const pointer = getPointerFromEvent(o);
					const points = [pointer.x, pointer.y, pointer.x, pointer.y]
					currentLine = new fabric.Line(points, {
						strokeWidth: 2,
						fill: 'red',
						stroke: 'red',
						selectable: false,
						evented: false
					})
					// console.log(currentLine)
					canvas.add(currentLine)
				})

				// 绘制中
				canvas.on('mouse:move', function(o) {
					const e = o.e;
					if (!isDrawing || isMultiTouch || drawMode) return;
					if (!currentLine) return
					// 如果中途变成双指，也不画
					if (e.touches && e.touches.length > 1) {
						isMultiTouch = true;
						return;
					}
					const pointer = getPointerFromEvent(o);
					currentLine.set({
						x2: pointer.x,
						y2: pointer.y
					})
					canvas.renderAll()
				})

				// 绘制结束
				canvas.on('mouse:up', function(o) {
					if (isMultiTouch) {
						isMultiTouch = false; // 恢复
						isDrawing = false;
						return;
					}
					if (!isDrawing) return;
					if (!currentLine) return;
					if (drawMode) return;

					isDrawing = false;

					const pointer = getPointerFromEvent(o)
					currentLine.set({
						x2: pointer.x,
						y2: pointer.y
					})
					canvas.requestRenderAll()

					// // 保存坐标
					lines.push(convertLineToImagePixel(currentLine))
					_this.$ownerInstance.callMethod('lineDrawn', lines);
					currentLine = null
				})

				this.$ownerInstance.callMethod('initDone');
			},
			loadScript(src, callback) {
				const script = document.createElement('script');
				script.src = src;
				script.onload = callback;
				script.onerror = (e) => console.error('加载失败:', src, e);
				document.head.appendChild(script);
			},
			onRenderChange(newValue, oldValue, ownerInstance, instance) {
				if (!Array.isArray(newValue)) return;
				// 遍历命令队列
				newValue.forEach(({
					method,
					args
				}) => {
					// console.log('渲染层收到调用:', method)

					switch (method) {
						case 'updateBackground':
							this.updateBackground(args);
							break;
						case 'clearLines':
							// console.log('渲调用:clearLines')
							this.clearLines();
							break;
						case 'draw':
							this.draw(args);
							break;
					}
				});


				// 执行完毕 → 回调逻辑层
				_this.$ownerInstance.callMethod("renderLayerAck", {
					type: "ack"
				});
			},
			clearLines() {
				// lines.splice(0, lines.length)
				canvas.getObjects().forEach(obj => {
					// if (obj !== canvas.backgroundImage) {
					// 	canvas.remove(obj);
					// }
					if (obj.type === 'line') {
						canvas.remove(obj)
					}
				});
				lines.splice(0, lines.length);
				console.log('清理后的焊缝', lines)
				canvas.renderAll();



			},
			updateBackground(base64) {

				const img = new Image();
				img.onload = () => {
					LOGIC_WIDTH = img.width;
					LOGIC_HEIGHT = img.height;

					displayWidth = container.clientWidth;
					displayHeight = container.clientHeight;

					dpr = window.devicePixelRatio || 1;

					const scaleX_display = displayWidth / LOGIC_WIDTH;
					const scaleY_display = displayHeight / LOGIC_HEIGHT;
					scale_display = Math.min(scaleX_display, scaleY_display);

					const scaledDisplayW = LOGIC_WIDTH * scale_display;
					const scaledDisplayH = LOGIC_HEIGHT * scale_display;

					left_display = (displayWidth - scaledDisplayW) / 2;
					top_display = (displayHeight - scaledDisplayH) / 2;

					// 不再乘 dpr，直接用显示比例和偏移
					const fabricImg = new fabric.Image(img, {
						originX: 'left',
						originY: 'top',
						selectable: false,
						evented: false,
					});

					fabricImg.set({
						left: left_display,
						top: top_display,
						scaleX: scale_display,
						scaleY: scale_display,
					});

					// canvas.setBackgroundImage(fabricImg, canvas.renderAll.bind(canvas));
					canvas.setBackgroundImage(fabricImg, () => {
						_this.$ownerInstance.callMethod('onConsole', '[DBG background]');
						_this.$ownerInstance.callMethod('onConsole', {
							LOGIC_WIDTH,
							LOGIC_HEIGHT,
							displayWidth,
							displayHeight,
							dpr,
							scale_display,
							left_display,
							top_display
						});
						canvas.renderAll();
						backgroundReady = true;

						// 如果有需要绘制的点，则开始绘制
						if (pendingDrawPoints) {
							this.draw(pendingDrawPoints);
							pendingDrawPoints = null; // 清空
						}
					});
				};

				img.src = `${base64}`;
			},
			draw(lines) {
				console.log('lines', lines)
				if (!canvas) {
					console.error("fabric canvas 未初始化");
					return;
				}

				if (!lines || lines.length < 2) {
					console.warn("点不足，无法画线");
					return;
				}


				if (!backgroundReady) {
					// 背景尚未加载好，暂存待绘制
					pendingDrawPoints = lines;
					return;
				}
				const p1 = convertImagePixelToCanvasPoint(lines[0].x, lines[0].y);
				const p2 = convertImagePixelToCanvasPoint(lines[1].x, lines[1].y);

				const points = [p1.x, p1.y, p2.x, p2.y];
				const editAbleLine = this.createEditableLineWithEvents(p1.x, p1.y, p2.x, p2.y);

			},

			createEditableLineWithEvents(x1, y1, x2, y2) {
				// 1. 创建线
				const line = new fabric.Line([x1, y1, x2, y2], {
					stroke: 'red',
					strokeWidth: 3,
					selectable: false,
					hasBorders: false,
					hasControls: false,
					hoverCursor: 'pointer'
				});

				// 2. 创建端点
				const p1 = new fabric.Circle({
					left: x1 - 8,
					top: y1 - 8,
					radius: 8,
					fill: 'white',
					stroke: 'red',
					strokeWidth: 2,
					originX: 'left',
					originY: 'top',
					selectable: true,
					evented: true,
					selectable: true, // 可以选中
					lockScalingX: true, // 禁止缩放
					lockScalingY: true,
					lockRotation: true, // 禁止旋转
					hasControls: false, // 不显示控制点
					hasBorders: false // 不显示边框
				});

				const p2 = new fabric.Circle({
					left: x2 - 8,
					top: y2 - 8,
					radius: 8,
					fill: 'white',
					stroke: 'red',
					strokeWidth: 2,
					originX: 'left',
					originY: 'top',
					selectable: true,
					evented: true,
					selectable: true, // 可以选中
					lockScalingX: true, // 禁止缩放
					lockScalingY: true,
					lockRotation: true, // 禁止旋转
					hasControls: false, // 不显示控制点
					hasBorders: false // 不显示边框
				});

				// 3. 绑定线和端点关系
				line.p1 = p1;
				line.p2 = p2;
				p1.line = line;
				p2.line = line;

				// 4. 添加到 Canvas
				canvas.add(line, p1, p2);
				canvas.off('object:mousedown');
				canvas.off('object:moving');
				// 5. 绑定事件（只绑定一次即可，多次调用可加标记判断）
				// if (!_editableLineEventsBound) {
				canvas.on('object:mousedown', (e) => {
					const obj = e.target;
					if (obj && obj.type === 'line') {
						obj._originalLeft = obj.left;
						obj._originalTop = obj.top;
					}
					drawMode = true;
				});

				canvas.on('object:moving', (e) => {
					const target = e.target;

					// 拖动端点
					if (target.line) {
						const line = target.line;
						if (target === line.p1) {
							line.set({
								x1: target.left + 8,
								y1: target.top + 8
							});
						} else if (target === line.p2) {
							line.set({
								x2: target.left + 8,
								y2: target.top + 8
							});
						}
						canvas.renderAll();
					}

					// 拖动整条线
					else if (target.type === 'line') {
						const dx = target.left - target._originalLeft;
						const dy = target.top - target._originalTop;

						target.p1.left += dx;
						target.p1.top += dy;
						target.p2.left += dx;
						target.p2.top += dy;

						target.set({
							x1: target.p1.left,
							y1: target.p1.top,
							x2: target.p2.left,
							y2: target.p2.top
						});

						target.p1.setCoords();
						target.p2.setCoords();
						canvas.renderAll();
					}
				});
				drawMode = true;
				_editableLineEventsBound = true;
				// === 松手后回调图像坐标 ===
				p1.on('modified', () => {
					const coords = convertLineToImagePixel(line);
					this.$ownerInstance.callMethod('updateWeldPixel', coords);
				});

				p2.on('modified', () => {
					const coords = convertLineToImagePixel(line);
					this.$ownerInstance.callMethod('updateWeldPixel', coords);
				});


				// }

				return line;
			},

		}
	}
</script>
<script>
	export default {
		name: "Home-Index",
		props: {
			command: {
				type: Object,
				default: {}
			}, // 父组件发送的指令
		},
		components: {

		},
		data() {
			return {
				renderCommand: [] // 逻辑层发给渲染层的“指令”

			};
		},
		computed: {
			currentWeld() {
				return this.$task.currentWeld;
			}
		},
		watch: {
			currentWeld(newVal) {
				const weld = newVal;
				if (newVal == null) return;
				this.callRenderMethod('updateBackground', "data:image/jpeg;base64," + weld.weld_image);
				const points = weld.weld_pixel_coordinate || [];
				if (points.length >= 2) {
					this.clearLines();
					this.callRenderMethod('draw', points);
				}
			},
			command(newVal) {
				if (!newVal || !newVal.cmd) return;
				switch (newVal.cmd) {
					case 'clearLines':
						this.clearLines();
						break;

						// 可以扩展更多指令
				}
			}
		},
		methods: {
			// 逻辑层调用渲染层方法
			callRenderMethod(method, args = {}) {
				this.renderCommand.push({
					method,
					args,
					timestamp: Date.now()
				})
				// 触发更新（关键：Vue/uni-app 的响应式数组要拷贝一份才能触发 watch）
				this.renderCommand = [...(this.renderCommand || [])];

				// console.log('this.renderCommand', this.renderCommand);
			},
			onConsole(msg) {
				console.log('渲染层打印', msg);
			},
			// 渲染层回调逻辑层
			renderLayerAck(e) {
				// console.log('逻辑层收到渲染层回调:', e)
				if (e && e.type === "ack") {
					// 渲染层执行完毕 → 清空队列
					this.renderCommand = [];
				}
				// console.log('this.renderCommand', this.renderCommand);
			},
			lineDrawn(line) {
				console.log('逻辑层收到渲染层回调:', line)
				this.$emit('lineDrawn', line);
			},
			clearLines() {
				this.callRenderMethod('clearLines');
			},
			updateWeldPixel(line) {
				//监听到焊缝位置变化
				// console.log('更细后的焊缝坐标',line)
				this.currentWeld.updateWeldPixel = line;
			},
			initDone() { //初始化完毕 第一次显示焊缝
				if (this.currentWeld) {
					this.callRenderMethod('updateBackground', "data:image/jpeg;base64," + this.currentWeld.weld_image);
					const points = this.currentWeld.weld_pixel_coordinate || [];
					if (points.length >= 2) {
						this.callRenderMethod('draw', points);
					}
				}
			}

		}

	}
</script>

<style lang="scss" scoped>
	.camera-view {
		position: relative;
		width: 100%;
		height: 100vh;
		/* 或者你需要的高度 */
		overflow: hidden;

		.image {
			width: 100%;
			height: 100%;
		}

		.canvas-container {
			width: 100%;
			height: 100%;
		}
	}
</style>
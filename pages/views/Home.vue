<template>
	<!-- <view v-if="!allDevicesConnected" class="reconnect-view">
		<view class="reconnect" @click="negateToConnect">
			<uni-icons type="redo" class="route-icon" size="20" color="#007aff"></uni-icons> <text>连接设备</text>
		</view>
	</view> -->
	<view>
		<view class="camera-view">
			<navi-top class="navi-top" v-if="stepCompleted"></navi-top>
			<!-- <message-card type="primary" :message="message[currentStep].message"
				:isLoading="message[currentStep].isLoading" class="message-card" v-if="currentStep < 3"></message-card> -->

			<!-- 点击后显示图片 canvas -->
			<!-- 2D 图片显示 -->
			<Monitor class="monitor" v-if="showImage" @lineDrawn="handleLineDrawn" :command="lineCommand"></Monitor>
			<view v-show="!showImage" class="image" id="canvas" ref="renderRef" :prop='renderCommand'
				:change:prop='renderRef.onRenderChange'>
				<!-- 3d视图 -->
			</view>
			<!-- <weld-choice class="left-bottom" @updateWeldClass="weld_class = $event" v-if="currentStep === 1">
			</weld-choice>
			<operation-sidebar class="right-mid" v-if="currentStep === 3"
				@changeTask="handleChangeTask"></operation-sidebar> -->
			<view class="left-bottom">
				<!-- <weld-param :delight="isParamSet" @handleChange="changeParam"></weld-param> -->
				<navigate-card class="navigate-card" :state="showNav" :currentNav="navigate_route"
					@nav-change="handleNavChange">
					<template #content>
						<navi-top-col v-if="navigate_route==='home'" :showNav="showNav"
							@showNav="showNav=$event"></navi-top-col>
						<setting v-if="navigate_route==='config'"></setting>
						<about v-if="navigate_route==='person'"></about>
					</template>
				</navigate-card>
			</view>
		</view>
		<!-- <button class="zoom" @click="fangda">+</button> -->
		<!-- <view v-if="currentStep === 4">
			<welding-message @goto-steps="handleGotoSteps" :is_finished="isFinished" :weld_param="weld_param"
				:is_simulate="simulateFlag" :weld_list="weldList"></welding-message>
		</view> -->
	</view>
</template>


<script module="renderRef" lang="renderjs">
	import {
		FoxgloveClient
	} from '@foxglove/ws-protocol';
	import {
		parse as parseRosMsg
	} from "@foxglove/rosmsg";
	import {
		CdrReader
	} from "@foxglove/cdr";
	import {
		MessageReader as Ros2MessageReader,
		MessageWriter as Ros2MessageWriter,
	} from '@foxglove/rosmsg2-serialization';
	// const THREE = require('static/libs/three/build/three.min.js')
	// import {
	// 	OrbitControls
	// } from 'static/libs/three/examples/jsm/controls/OrbitControls.js'

	import Stats from 'static/libs/three/examples/jsm/libs/stats.module.js';
	import {
		Line2
	} from 'static/libs/three/examples/jsm/lines/Line2.js';
	import {
		LineMaterial
	} from 'static/libs/three/examples/jsm/lines/LineMaterial.js';
	import {
		LineGeometry
	} from 'static/libs/three/examples/jsm/lines/LineGeometry.js';
	// const ThreeBSP = require('static/libs/three/build/ThreeBSP.js')(THREE)
	let THREE, OrbitControls;
	var renderer;
	var scene;
	var camera;
	var controls;
	var geometry, material;
	let pmremGenerator, envMap;
	let renderEnabled = false;
	let timeOut = null;
	let recordedPoints = [];
	// 全局变量
	let totalPoints = 0;
	let pointCloud;
	const maxPoints = 500000;
	const positions = new Float32Array(maxPoints * 3);
	let schemaCache = new Map();
	let cloudSubId;
	let makerSubId;
	let ws;
	let client;
	let clientOpen = false; // 由 client.on("open"/"close") 来维护
	// 定义一个全局数组来存放箭头
	let arrows = [];
	let readerMap = new Map();
	// const sharedLineMaterial = new THREE.LineBasicMaterial({
	// 	color: 0x409EFF
	// });
	// const sharedMeshMaterial = new THREE.MeshBasicMaterial({
	// 	color: 0x409EFF
	// });
	// const sharedLineGeometry = new THREE.BufferGeometry(); // 可以根据需要初始化
	// const sharedConeGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
	let sharedLineMaterial, sharedMeshMaterial, sharedLineGeometry, sharedConeGeometry;
	export default {
		mounted() {
			// this.initCanvas();
			this.loadThreeLibs();
		},
		methods: {
			/* 小工具 */
			loadThreeLibs() {
				// 已加载过则直接初始化
				if (window.THREE) {
					THREE = window.THREE;
					OrbitControls = window.OrbitControls || THREE.OrbitControls;
					this.initCanvas();
					return;
				}

				// 先加载 three.min.js
				this.loadScript('static/libs/three/build/three.min.js', () => {
					THREE = window.THREE;

					sharedLineMaterial = new THREE.LineBasicMaterial({
						color: 0x005cff
					});
					sharedMeshMaterial = new THREE.MeshBasicMaterial({
						color: 0x005cff
					});
					sharedLineGeometry = new THREE.BufferGeometry(); // 可以根据需要初始化
					sharedConeGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
					// 再加载 OrbitControls.js
					this.loadScript('static/libs/three/examples/js/controls/OrbitControls.js', () => {
						OrbitControls = window.OrbitControls || THREE.OrbitControls;

						// 全部加载完毕后执行初始化
						this.initCanvas();
						// this.initMarkers();
					});
				});
			},
			loadScript(src, callback) {
				const script = document.createElement('script');
				script.src = src;
				script.onload = callback;
				script.onerror = (e) => console.error('加载失败:', src, e);
				document.head.appendChild(script);
			},

			isWsOpen() {
				return !!ws && ws.readyState === 1; // 1 === WebSocket.OPEN
			},
			isClientOpen() {
				return !!client && clientOpen === true;
			},
			onRenderChange(newValue, oldValue, ownerInstance, instance) {
				if (!Array.isArray(newValue)) return;
				// 遍历命令队列
				newValue.forEach(({
					method,
					args
				}) => {
					this.$ownerInstance.callMethod('onConsole', '渲染层收到调用' + method);

					switch (method) {
						case 'initCanvas':
							this.initCanvas();
							ownerInstance.callMethod('onConsole', 'initCanvas');
							break;
						case 'initPrintClouds':
							this.clearArrows();
							this.clearPointCloud();
							this.initPrintClouds(args);
							ownerInstance.callMethod('onConsole', 'initPrintClouds');
							break;
						case 'reloadData':
							this.reloadData(args);
							break;
						case 'printMarkers':
							this.updateMarkers();
							break;
						case 'initMarkers':
							this.initMarkers();
							break;
						case 'clearArrows':
							this.$ownerInstance.callMethod('onConsole', 'clearArrows');
							this.clearArrows();
							break;
						case "markedImages":
							this.markedImages(args);
							break;
						case "showWeld":
							this.showMarkedImage(args);
						case 'fangda':
							this.fangda();
							break;
					}
				});


				// 执行完毕 → 回调逻辑层
				ownerInstance.callMethod("renderLayerAck", {
					type: "ack"
				});
			},
			initCanvas() {
				let that = this
				/* 创建场景对象Scene */
				console.log('打印场景API', THREE.Scene);
				scene = new THREE.Scene();
				scene.background = new THREE.Color(0x000000); // 黑色

				/*
				点云材质 颜色
				*/
				geometry = new THREE.BufferGeometry();
				geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
				material = new THREE.PointsMaterial({
					size: 0.001,
					color: 0x42b983
				});

				pointCloud = new THREE.Points(geometry, material);
				scene.add(pointCloud);

				/*
				    相机设置
				 */
				var width = window.innerWidth; // 窗口宽度
				var height = window.innerHeight; // 高度
				camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
				camera.position.set(-1.5, 1, 1);
				const dir = new THREE.Vector3(0, 0, 0).normalize(); // 你保存的方向
				const camPos = camera.position.clone();
				const target = camPos.clone().add(dir);
				camera.lookAt(target);
				scene.add(camera);

				/*
				    创建渲染器对象
				 */
				const element = document.getElementById('canvas');
				renderer = new THREE.WebGLRenderer({
					antialias: true,
					alpha: true
				});
				renderer.outputEncoding = THREE.sRGBEncoding;
				renderer.setPixelRatio(1);
				renderer.setSize(window.innerWidth, window.innerHeight, false);
				element.appendChild(renderer.domElement); // body元素中插入canvas对象

				/*
				    控制器
				 */
				controls = new OrbitControls(camera, renderer.domElement);
				controls.enablePan = false; //滑动
				controls.enableDamping = true;
				controls.dampingFactor = 0.05;
				controls.screenSpacePanning = false;
				controls.maxPolarAngle = Math.PI / 2; //2.8 1.8 Math.PI / 1
				controls.addEventListener('change', function() {
					that.timeRender();
					const dir = new THREE.Vector3();
					camera.getWorldDirection(dir);
				});


				/*
				    网格
				 */
				const size = 5; // 网格总尺寸
				const divisions = 5; // 网格分割数
				const gridHelper = new THREE.GridHelper(size, divisions, 0x444444, 0x888888);
				scene.add(gridHelper);


				/*
					动画
				 */
				that.animate();

				// 执行渲染操作，指定场景，相机作为参数
				renderer.render(scene, camera);
				const raycaster = new THREE.Raycaster();
				const mouse = new THREE.Vector2();
				console.log('renderer.domElement', renderer.domElement);
				renderer.domElement.addEventListener('click', (event) => {

				});
				console.log('初始场景渲染完成');
			},
			fangda() {
				const dir = new THREE.Vector3();
				camera.getWorldDirection(dir); // 获取相机朝向
				camera.position.addScaledVector(dir, 0.5); // 向前移动0.5单位
				camera.updateProjectionMatrix();
			},
			initPrintClouds(HOST) {

				if (this.isWsOpen() && this.isClientOpen()) {
					this.$ownerInstance.callMethod('onConsole', 'createClientFromExistingWs：没有可用 ws');
					return;
				}
				const PORT = 8765;
				const url = `ws://${HOST}:${PORT}`;

				// 1) 先创建底层 WebSocket，并设置 binaryType
				const ws = new WebSocket(url, ["foxglove.sdk.v1", "foxglove.websocket.v1"]);
				ws.binaryType = "arraybuffer";

				ws.onopen = () => console.log("底层 WebSocket open");
				ws.onerror = (e) => console.error("底层 WebSocket error", e);
				ws.onclose = () => console.log("底层 WebSocket close");

				// 2) 立即创建 FoxgloveClient（不要把事件注册放得太晚）
				const client = new FoxgloveClient({
					ws
				});

				// 3) 关键事件监听（尽早注册）
				client.on("open", () => {
					clientOpen = true;
					console.log("FoxgloveClient open");
				});
				client.on("close", () => {
					clientOpen = false;
					console.log("FoxgloveClient close");
				});
				client.on("error", (err) => {
					clientOpen = false;
					console.log("FoxgloveClient error");
				});
				let pointCloudId;
				// advertise：查看服务端对我们广播的 channels
				client.on("advertise", (channels) => {
					console.log("收到 advertise channels:", channels);
					// 自动订阅所有 channel（方便调试）
					for (const channel of channels) {
						console.log("  广告：", channel.topic, channel.encoding, channel.id);
						if (channel.topic === '/vision/cloud') {
							this.$ownerInstance.callMethod('startImageWs');
							const subId = client.subscribe(channel.id);
							cloudSubId = subId;
							const definitions = parseRosMsg(channel.schema, {
								ros2: true
							});
							this.$ownerInstance.callMethod('onConsole', definitions);
							// const reader = new CdrReader(definitions);
							readerMap.set(subId, definitions);
							// this.clearPointCloud();
							this.clearArrows();
							this.$ownerInstance.callMethod('onConsole', ' 已订阅 cloud subId=' + subId);
						}
						if (channel.topic === '/markers_tool_y') {
							const subId = client.subscribe(channel.id);
							makerSubId = subId;
							const definitions = parseRosMsg(channel.schema, {
								ros2: true
							});
							// const reader = new CdrReader(definitions);
							readerMap.set(subId, definitions);
							this.$ownerInstance.callMethod('onConsole', ' 已订阅 makers_tool_y subId=' + subId);
						}
					}
				});

				// message：打印每条来自订阅的消息（原始二进制/JSON）
				client.on("message", ({
						subscriptionId,
						timestamp,
						data
					}

				) => {
					this.$ownerInstance.callMethod('onConsole', ' 收到 subscriptionId :' + subscriptionId);
					if (subscriptionId === cloudSubId) {
						this.$ownerInstance.callMethod('onConsole', '渲染点云');
						this.updateCloudPonits(data);
					} else if (subscriptionId === makerSubId) {
						this.$ownerInstance.callMethod('onConsole', '清除旧焊缝');
						const defs = readerMap.get(subscriptionId);
						const reader = new Ros2MessageReader(defs);
						const msg = reader.readMessage(data);
						console.log('msg', msg)
						this.$ownerInstance.callMethod('onConsole', msg);
						this.$ownerInstance.callMethod('onConsole', '渲染焊缝');
						this.updateMarkers(msg.markers);
					}

				});
			},
			sanitizeRos2Schema(schema) {
				return schema
					// 去掉 "float64 x 0" → "float64 x"
					.replace(/^(\s*\w+\s+\w+)\s+[-\d.eE]+$/gm, "$1")
					// 去掉常量定义里的 "= 数值"
					.replace(/^(\s*\w+\s+\w+)\s*=\s*.+$/gm, "$1");
			},
			animate() {
				if (renderEnabled) {
					controls.update();
					this.render();
				}
				requestAnimationFrame(() => {
					this.animate();
				});
			},
			// 动画
			render() {
				renderer.render(scene, camera); //执行渲染操作
			},
			//刻度坐标系
			createAxisTicks(length = 5, divisions = 10) {
				const material = new THREE.LineBasicMaterial({
					color: 0xffffff
				});
				const points = [];

				const step = length / divisions;
				for (let i = 0; i <= divisions; i++) {
					const pos = i * step;

					// X 轴刻度
					points.push(new THREE.Vector3(pos, 0, 0));
					points.push(new THREE.Vector3(pos, 0.1, 0)); // 小短线

					// Y 轴刻度
					points.push(new THREE.Vector3(0, pos, 0));
					points.push(new THREE.Vector3(0.1, pos, 0));

					// Z 轴刻度
					points.push(new THREE.Vector3(0, 0, pos));
					points.push(new THREE.Vector3(0, 0.1, pos));
				}

				const geometry = new THREE.BufferGeometry().setFromPoints(points);
				const line = new THREE.LineSegments(geometry, material);
				return line;
			},
			/*
				渲染判断
			    在没有动画的情况下，可以在有需要的时候渲染，提高性能
			 */
			timeRender() {
				//设置为可渲染状态
				renderEnabled = true;
				//清除上次的延迟器
				if (timeOut) {
					clearTimeout(timeOut);
				}
				//开启动画时需要一直渲染，不能暂停渲染操作
				// timeOut = setTimeout(function () {
				//     renderEnabled = false;
				// }, 3000);
			},


			updateCloudPonits(data) {
				// 已经达到最大点数，不再更新

				if (totalPoints >= maxPoints) {
					console.log('already max');
					return;
				}
				const dv = new DataView(
					data.buffer,
					data.byteOffset + 16,
					Math.max(0, data.byteLength - 16)
				);
				const pointStep = 32;
				const numPoints = Math.floor(dv.byteLength / pointStep);
				const pointsToAdd = Math.min(numPoints, maxPoints - totalPoints);

				for (let i = 0; i < pointsToAdd; i++) {

					const offset = i * pointStep;

					if (offset + 16 + 4 > dv.byteLength) { // 边界检查
						console.warn("skip incomplete point at end");
						break;
					}
					if (offset + pointStep > dv.byteLength) break;
					const x = (dv.getFloat32(offset + 0, true));
					const y = (dv.getFloat32(offset + 4, true));
					const z = (dv.getFloat32(offset + 8, true));
					const intensity = (dv.getFloat32(offset + 16, true)); // 提取 intensity
					// 原有渲染逻辑
					positions[(totalPoints + i) * 3] = x;
					positions[(totalPoints + i) * 3 + 1] = z - 0.4;
					positions[(totalPoints + i) * 3 + 2] = y;
					if (i === 0) console.log('x :' + positions[(totalPoints + i) * 3] + ' y :' + positions[(totalPoints +
						i) * 3 + 1] + ' z :' + positions[(totalPoints + i) * 3 + 2]);
					recordedPoints.push({
						x,
						y,
						z
					});
				}
				// totalPoints += pointsToAdd;
				totalPoints = pointsToAdd;
				console.log('pointsToAdd：', pointsToAdd);
				console.log('totalPoints：', totalPoints);

				// 更新属性
				geometry.setDrawRange(0, totalPoints);
				geometry.attributes.position.needsUpdate = true;

				this.timeRender();
			},
			clearPointCloud() {
				this.$ownerInstance.callMethod('onConsole', '清空点云数据');
				if (!geometry || !geometry.attributes.position) return;

				// 清空数组（可选，但有助于避免残影）
				positions.fill(0);



				// 不绘制任何点
				geometry.setDrawRange(0, 0);
				// 通知 three.js 缓冲区更新
				geometry.attributes.position.needsUpdate = true;
				totalPoints = 0;

				this.timeRender();
				this.$ownerInstance.callMethod('onConsole', '清空点云数据完成');
			},
			hexToDataView(hexStr) {
				// 去掉多余空格和换行
				hexStr = hexStr.replace(/[\s\n]+/g, "");

				// 每两个字符代表一个字节
				const len = hexStr.length / 2;
				const buffer = new ArrayBuffer(len);
				const arr = new Uint8Array(buffer);

				for (let i = 0; i < len; i++) {
					arr[i] = parseInt(hexStr.substr(i * 2, 2), 16);
				}

				return new DataView(buffer);
			},
			updateMarkers(markers) {
				this.$ownerInstance.callMethod('onConsole', '  markers :' + markers.length);

				// 起点
				for (var index = 0; index < markers.length; index++) {
					var marker = markers[index];
					this.$ownerInstance.callMethod('onConsole', ' marker.pose.position.x ：' + marker.pose.position.x);
					const origin = new THREE.Vector3(
						marker.pose.position.x,
						marker.pose.position.z - 0.4,
						marker.pose.position.y,

					);
					// 四元数转方向向量
					// 原始四元数
					const q = new THREE.Quaternion(
						marker.pose.orientation.x,
						marker.pose.orientation.y,
						marker.pose.orientation.z,
						marker.pose.orientation.w
					);

					// 定义 Y-Z 交换的矩阵
					const swapYZ = new THREE.Matrix4().set(
						1, 0, 0, 0,
						0, 0, 1, 0,
						0, 1, 0, 0,
						0, 0, 0, 1
					);

					// 把这个矩阵转成四元数
					const swapQuat = new THREE.Quaternion().setFromRotationMatrix(swapYZ);

					// 修正后的四元数 = 先换坐标系，再应用原始旋转
					const qFixed = swapQuat.clone().multiply(q);
					const dir = new THREE.Vector3(1, 0, 0); // 默认沿X轴
					dir.applyQuaternion(qFixed); // 根据四元数旋转方向
					// ArrowHelper
					const length = marker.scale.x; // 使用 scale.x 作为长度
					const color = 0xff0000; // 红色
					const arrow = new THREE.ArrowHelper(dir, origin, length);
					// 替换内部材质为共享的
					if (arrow.line) arrow.line.material = sharedLineMaterial;
					if (arrow.cone) arrow.cone.material = sharedMeshMaterial;
					scene.add(arrow);
					arrows.push(arrow);
				}
			},
			parseMarkerArray(dv) { //解析Marker数据流
				let offset = 4; // 跳过前 4 个字节 header（如果有的话）

				// Marker 数量
				const markerCount = dv.getUint32(offset, true);
				offset += 4;

				// Header 时间（假设同所有 marker 共享）
				const sec = dv.getUint32(offset, true);
				offset += 4;
				const nsec = dv.getUint32(offset, true);
				offset += 4;

				let markers = [];

				for (let i = 0; i < markerCount; i++) {
					// 读取 frame_id
					const frameIdLen = dv.getUint32(offset, true);

					offset += 4;
					let frameIdChars = [];
					for (let j = 0; j < frameIdLen; j++) {
						frameIdChars.push(String.fromCharCode(dv.getUint8(offset++)));
					}

					const frame_id = frameIdChars.join("");
					this.$ownerInstance.callMethod('onConsole', 'frame_id ：' + frame_id);

					// 读取 namespace
					// 对齐到4字节边界
					while ((offset % 4) !== 0) offset++;
					const nsLen = dv.getUint32(offset, true);

					offset += 4;
					let nsChars = [];
					for (let j = 0; j < nsLen; j++) {
						nsChars.push(String.fromCharCode(dv.getUint8(offset++)));
					}
					const ns = nsChars.join("");
					this.$ownerInstance.callMethod('onConsole', 'ns ：' + ns);
					while ((offset % 4) !== 0) offset++;
					// id, type, action
					const id = dv.getInt32(offset, true);
					offset += 4;
					const type = dv.getInt32(offset, true);
					offset += 4;
					const action = dv.getInt32(offset, true);
					offset += 4;

					console.log(offset % 8);
					while (offset % 8 !== 0) offset++; // 对齐到 8
					offset = offset + 4
					// pose.position
					const px = dv.getFloat64(offset, true);
					offset += 8;
					const py = dv.getFloat64(offset, true);
					offset += 8;
					const pz = dv.getFloat64(offset, true);
					offset += 8;

					// pose.orientation
					const ox = dv.getFloat64(offset, true);
					offset += 8;
					const oy = dv.getFloat64(offset, true);
					offset += 8;
					const oz = dv.getFloat64(offset, true);
					offset += 8;
					const ow = dv.getFloat64(offset, true);
					offset += 8;

					// scale
					const sx = dv.getFloat64(offset, true);
					offset += 8;
					const sy = dv.getFloat64(offset, true);
					offset += 8;
					const sz = dv.getFloat64(offset, true);
					offset += 8;

					// color
					const r = dv.getFloat32(offset, true);
					offset += 4;
					const g = dv.getFloat32(offset, true);
					offset += 4;
					const b = dv.getFloat32(offset, true);
					offset += 4;
					const a = dv.getFloat32(offset, true);
					offset += 4;
					// ---------- lifetime (Duration) ----------
					const life_sec = dv.getInt32(offset, true);
					const life_nsec = dv.getUint32(offset + 4, true);
					offset += 4; // sec
					offset += 4; // nsec
					this.$ownerInstance.callMethod('onConsole', 'life_sec ：' + life_sec);
					this.$ownerInstance.callMethod('onConsole', 'life_nsec ：' + life_nsec);
					// ---------- frame_locked (bool) ----------
					const frame_locked = dv.getUint8(offset);
					this.$ownerInstance.callMethod('onConsole', 'frame_locked ：' + frame_locked);
					offset += 1;
					// padding 到 4
					while (offset % 4 !== 0) offset++;

					// ---------- points (geometry_msgs/Point[]) ----------
					const pointsLen = dv.getUint32(offset, true);
					offset += 4;
					offset += pointsLen * (8 * 3); // x,y,z float64

					// ---------- colors (ColorRGBA[]) ----------
					const colorsLen = dv.getUint32(offset, true);
					offset += 4;
					offset += colorsLen * (4 * 4); // float32 * 4

					// ---------- texture_resource (string) ----------
					let len = dv.getUint32(offset, true);
					offset += 4 + len;
					while (offset % 4 !== 0) offset++;

					// ---------- texture (sensor_msgs/Image) ----------
					// header
					offset += 4; // sec
					offset += 4; // nsec
					len = dv.getUint32(offset, true);
					offset += 4 + len;
					while (offset % 4 !== 0) offset++;

					// format string
					len = dv.getUint32(offset, true);
					offset += 4 + len;
					while (offset % 4 !== 0) offset++;

					// data
					len = dv.getUint32(offset, true);
					offset += 4 + len;

					// ---------- uv_coordinates (Point32[]) ----------
					const uvLen = dv.getUint32(offset, true);
					offset += 4;
					offset += uvLen * (4 * 3); // float32 x y z

					// ---------- text (string) ----------
					len = dv.getUint32(offset, true);
					offset += 4 + len;
					while (offset % 4 !== 0) offset++;

					// ---------- mesh_resource (string) ----------
					len = dv.getUint32(offset, true);
					offset += 4 + len;
					while (offset % 4 !== 0) offset++;

					// ---------- mesh_file ----------
					len = dv.getUint32(offset, true); // filename
					offset += 4 + len;
					while (offset % 4 !== 0) offset++;

					len = dv.getUint32(offset, true); // data
					offset += 4 + len;

					// ---------- mesh_use_embedded_materials (bool) ----------
					const mesh_use_embedded_materials = dv.getUint8(offset);
					this.$ownerInstance.callMethod('onConsole', 'mesh_use_embedded_materials ：' +
						mesh_use_embedded_materials);
					offset += 1;
					while (offset % 4 !== 0) offset++;

					markers.push({
						header: {
							stamp: {
								sec,
								nsec
							},
							frame_id
						},
						ns,
						id,
						type,
						action,
						pose: {
							position: {
								x: px,
								y: py,
								z: pz
							},
							orientation: {
								x: ox,
								y: oy,
								z: oz,
								w: ow
							}
						},
						scale: {
							x: sx,
							y: sy,
							z: sz
						},
						color: {
							r,
							g,
							b,
							a
						}
					});
				}
				this.$ownerInstance.callMethod('onConsole', 'markers ：' + markers);

				return markers;

			},
			//校验坐标是否有效
			isValidPoint(x, y, z, maxRange = 100, minAbs = 1e-5) {
				// 检查是否为有限数
				if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
					return false;
				}

				// 检查是否超出范围
				if (Math.abs(x) > maxRange || Math.abs(y) > maxRange || Math.abs(z) > maxRange) {
					return false;
				}

				// 检查是否太接近0，属于噪声
				if (Math.abs(x) < minAbs && Math.abs(y) < minAbs && Math.abs(z) < minAbs) {
					return false;
				}

				return true;
			},
			//保存点云数据
			savePointCloudApp(data) {
				const fileName = "_doc/pointcloud.json"; // App 私有目录
				plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
					fs.root.getFile(fileName, {
						create: true
					}, (fileEntry) => {
						fileEntry.createWriter((writer) => {
							writer.write(JSON.stringify(data));
							console.log("点云保存成功:", fileName);
						}, (err) => {
							console.error("写入失败:", err);
						});
					});
				});
			},
			//创建标签
			createLabel(text, position) {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				ctx.font = '24px Arial';
				ctx.fillStyle = 'white';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(text, canvas.width / 2, canvas.height / 2);

				const texture = new THREE.CanvasTexture(canvas);
				const material = new THREE.SpriteMaterial({
					map: texture,
					transparent: true
				});
				const sprite = new THREE.Sprite(material);
				sprite.position.copy(position);
				sprite.scale.set(2, 1, 1); // 调整显示大小
				scene.add(sprite);
				return sprite;
			},
			clearArrows() {
				this.$ownerInstance.callMethod('onConsole', arrows);
				if (!Array.isArray(arrows)) {
					arrows = [];
					return;
				}
				console.log('arrows', arrows);
				for (let i = 0; i < arrows.length; i++) {
					const arrow = arrows[i];
					if (!arrow) continue; // 如果元素是 undefined，就跳过
					this.$ownerInstance.callMethod('onConsole', ' 正在移除arrow');

					scene.remove(arrow);
				}
				arrows = []; // 清空引用
				this.$ownerInstance.callMethod('onConsole', 'clearArrows');
			},
			initMarkers() {

				const origin = new THREE.Vector3(
					1,
					2,
					1,

				);
				// 四元数转方向向量
				// 原始四元数
				const q = new THREE.Quaternion(
					1,
					1,
					1,
					1
				);

				// 定义 Y-Z 交换的矩阵
				const swapYZ = new THREE.Matrix4().set(
					1, 0, 0, 0,
					0, 0, 1, 0,
					0, 1, 0, 0,
					0, 0, 0, 1
				);

				// 把这个矩阵转成四元数
				const swapQuat = new THREE.Quaternion().setFromRotationMatrix(swapYZ);

				// 修正后的四元数 = 先换坐标系，再应用原始旋转
				const qFixed = swapQuat.clone().multiply(q);
				const dir = new THREE.Vector3(1, 0, 0); // 默认沿X轴
				dir.applyQuaternion(qFixed); // 根据四元数旋转方向
				// ArrowHelper
				const length = 1; // 使用 scale.x 作为长度
				const color = 0x003bff; // 红色
				const arrow = new THREE.ArrowHelper(dir, origin, length);
				// 替换内部材质为共享的
				if (arrow.line) arrow.line.material = sharedLineMaterial;
				if (arrow.cone) arrow.cone.material = sharedMeshMaterial;
				scene.add(arrow);
				arrows.push(arrow);
			},
			markedImages(list) {
				const tasks = list.map(item => {
					const base64 = item.weld_image;
					const points = item.weld_pixel_coordinate || [];

					// 如果没有原图或没有坐标点 → 直接返回原图
					if (!base64 || points.length < 2) {
						item.marked_image = base64;
						return Promise.resolve();
					}
					return new Promise((resolve) => {

						// 1. 图片加载
						const img = new Image();
						img.src = base64;
						img.src = base64.startsWith('data:image') ? base64 : 'data:image/jpeg;base64,' +
							base64;
						img.onload = () => {
							// 2. canvas 初始化
							const canvas = document.createElement("canvas");
							const ctx = canvas.getContext("2d");

							canvas.width = img.width;
							canvas.height = img.height;

							// 3. 绘制原图
							ctx.drawImage(img, 0, 0);

							// 4. 绘制焊缝
							ctx.strokeStyle = "red";
							ctx.lineWidth = 10;
							ctx.beginPath();

							ctx.moveTo(points[0].x, points[0].y);
							for (let i = 1; i < points.length; i++) {
								ctx.lineTo(points[i].x, points[i].y);
							}
							ctx.stroke();

							// 5. 生成新 base64
							item.marked_image = canvas.toDataURL("image/jpeg");
							console.log('图片加载', item);
							resolve();
						};
						img.onerror = () => {
							console.log('图片加载失败', item);
							this.$ownerInstance.callMethod('onConsole', "图片加载失败");
							// 防止 Promise 永远 pending
							item.marked_image = base64;
							resolve();
						};
					});
				});
				// 所有图片处理完成后再更新 UI
				return Promise.all(tasks).then(() => {
					this.$ownerInstance.callMethod('handleMarkedImages', list);
				});
			},
			showMarkedImage(weld) {
				this.$nextTick(() => {
					const canvas = document.getElementById("imageCanvas");
					canvas.width = window.innerWidth;
					canvas.height = window.innerHeight;
					const ctx = canvas.getContext("2d");
					if (!ctx) {
						console.error("2D canvas context 获取失败");
						return;
					}
					const img = new Image();
					img.src = item.weld_image.startsWith("data:image") ?
						item.weld_image :
						"data:image/jpeg;base64," + item.weld_image;

					img.onload = () => {
						// 缩放图片铺满屏幕
						ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

						// 画焊缝
						const points = item.weld_pixel_coordinate || [];
						if (points.length >= 2) {
							ctx.strokeStyle = "red";
							ctx.lineWidth = 4;
							ctx.beginPath();
							ctx.moveTo(points[0].x, points[0].y);
							for (let i = 1; i < points.length; i++) {
								ctx.lineTo(points[i].x, points[i].y);
							}
							ctx.stroke();
						}
					};
				});
			}
		}
	}
</script>
<script>
	import deviceStatus from "@/store/deviceStatus";
	import naviTop from "@/components/navi-top/index.vue";
	import MessageCard from "@/components/message-card/index.vue";
	import WeldChoice from "@/components/weld-choice/index.vue";
	import OperationSidebar from "@/components/operation-sidebar/index.vue";
	import WeldParam from "@/components/weld-param/index.vue";
	import WeldSet from "@/components/weld-set/index.vue";
	import WeldingMessage from "@/components/welding-message/index.vue";
	import NavigateCard from '@/components/navigate-card/index.vue';
	import NaviTopCol from '@/components/navi-top/col-index.vue';
	import Monitor from "@/components/monitor/index.vue"
	import log from "../../utils/log";
	import Setting from '@/pages/views/Setting.vue'
	import About from '@/components/about/index.vue'
	export default {
		name: "Home-Index",
		components: {
			naviTop,
			MessageCard,
			WeldChoice,
			OperationSidebar,
			WeldParam,
			WeldSet,
			WeldingMessage,
			NavigateCard,
			NaviTopCol,
			Setting,
			About,
			Monitor
		},
		data() {
			return {
				socket: null,
				cameraImage: null,
				currentIndex: 0,
				timer: null,
				socketTask: null,
				startIdentify: false,
				weld_param: {},
				isParamSet: false,
				reconnectAttempts: 0, // 定义重连相关变量
				maxReconnectAttempts: 10, // 定义重连相关变量  最大重连次数
				reconnectTimer: null, // 定义重连相关变量
				isFinished: false,
				imageInfo: '暂无图像',
				simulateFlag: false,
				navigate_state: 1, // 1=上下布局，2=内容卡片，3=内容卡片+返回
				navigate_route: 'home',
				showNav: true,
				renderCommand: [], // 逻辑层发给渲染层的“指令”
				// showImage: false,
				lineCommand: {}, // 发送给canvs的指令
				updatingWeld: false,
			};
		},
		computed: {
			allDevicesConnected() {
				return (
					deviceStatus.armStatus === "正常" &&
					deviceStatus.cameraStatus === "正常" &&
					deviceStatus.welderStatus === "正常"
				);
			},
			showMessage() {
				return this.$task.currentStep === 0;
			},
			currentStep() {
				return this.$task.currentStep
			},
			stepTrigger() {
				return this.$task.stepTrigger;
			},
			currentWeld() {
				return this.$task.currentWeld;
			},
			stepCompleted() {
				return this.$task.stepCompleted
			},
			currentStepConfig() {
				return this.$task.steps.find(s => s.index === this.$task.currentStep) || {}
			},
			showImage() {
				return this.$task.showImage
			}
		},
		mounted() {
			console.log('this.allDevicesConnected', this.allDevicesConnected);
			if (this.allDevicesConnected) {
				this.handleInit();
			}
		},
		created() {},
		watch: {
			stepTrigger(newVal) {
				const step = this.currentStep;
				console.log('stepTrigger', newVal)
				console.log('stepTrigger step', step)
				if (step === 0) {

				} else if (step === 1) {
					console.log('开始建立点云');
					this.handlePointCloudInit();
				} else if (step === 2) {
					console.log('开始识别焊缝');
					this.startIdentifyTask();
				} else if (step === 3) {
					console.log('开始编辑焊缝');
					this.generateMarkedImages().then(() => {
						this.$task.stepCompleted = true;
					});
				} else if (step === 4) {
					console.log('开始模拟焊接');
					this.simulateFlag = true;
					this.startTask();
				} else if (step === 5) {
					console.log('开始实际焊接');
					this.simulateFlag = false;
					this.startTask();
				} else if (step === 6) {
					console.log('保存焊缝');
					const updateWeldPixel = this.currentWeld.updateWeldPixel;
					console.log('updateWeldPixel', updateWeldPixel)
					if (updateWeldPixel == null) { //没有更新 则直接返回
						this.$task.stepCompleted = true;
						this.$task.editMode = false;
						this.$task.showImage = false;
						this.currentStepConfig.status = 'COMPLETED';
						this.$task.currentStep = 3;
						return;
					}
					const data = {
						"type": "get_weld_robot_position",
						"weld_name": this.currentWeld.weld_id,
						"weld_datas": [{
							"weld_pixel_coordinate": [{
									"x": updateWeldPixel.x1,
									"y": updateWeldPixel.y1
								},
								{
									"x": updateWeldPixel.x2,
									"y": updateWeldPixel.y2
								}
							]
						}],
						"camera_position": this.currentWeld.camera_position
					}
					this.$rest.updateWeldPosition(data).then(res => {
						if (res.get_weld_robot_position_status) {
							console.log('重新识别')
							this.startIdentify = true;
						}
					})
				}
			},
			currentStep(newVal) {
				console.log("当前阶段：", newVal);
			},
			stepCompleted(newVal, oldVal) {
				if (!newVal) {
					this.showNav = false;
				}
			},
			allDevicesConnected(newVal) {
				if (!newVal) {
					uni.$emit('updateDeviceStatus', false);
				}
			},
			currentWeld(newVal) {
				if (newVal && Object.keys(newVal).length > 0) {
					this.$task.showImage = true;
					console.log('显示2d画面')
				}

			}
		},
		beforeDestroy() {
			if (this.socket) {
				this.socket.close();
			}
		},
		onUnload() {
			this.stopImageLoop();
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

				console.log('this.renderCommand', this.renderCommand);
			},
			onConsole(msg) {
				console.log('渲染层打印', msg);
			},
			// 渲染层回调逻辑层
			renderLayerAck(e) {
				console.log('逻辑层收到渲染层回调:', e)
				if (e && e.type === "ack") {
					// 渲染层执行完毕 → 清空队列
					this.renderCommand = [];
				}
				console.log('this.renderCommand', this.renderCommand);
			},
			startImageWs() {
				this.$rest
					.startImageWs()
					.then((res) => {
						const data = res.data;
						if (data.initial_image_status) {
							console.log('成功扫描');
						}
					})
					.catch((err) => {});
			},
			handleInit() { //第一步初始化
				this.connectWebSocket();
			},
			negateToConnect() {
				this.$emit('navigateTo', 'Connect');
			},
			connectWebSocket() {
				const deviceIp = uni.getStorageSync("device_ip");
				console.log(deviceIp);

				if (!deviceIp) {
					console.error("device_ip 不存在");
					return;
				}

				const IP = deviceIp.split(":")[0]; // 从 device_ip 提取 IP
				const wsPort = this.$config.wsProt;
				const wsUrl = "ws://" + IP + ":" + wsPort + "/ws?camera=Cam01";
				console.log("WebSocket URL:", wsUrl);
				// 定义重连相关变量（放在 this 上，保证多次调用共享）
				if (!this.reconnectAttempts) this.reconnectAttempts = 0;
				if (!this.maxReconnectAttempts) this.maxReconnectAttempts = 10; // 最大重连次数
				if (!this.reconnectTimer) this.reconnectTimer = null;
				// 建立连接
				this.socketTask = uni.connectSocket({
					url: wsUrl,
					success: () => {
						console.log("WebSocket 发起连接成功");
					},
					fail: (err) => {
						console.error("WebSocket 连接失败:", err);
						scheduleReconnect();
					},
				});
				const createSocket = () => {
					if (this.socketTask == null) {
						this.socketTask = uni.connectSocket({
							url: wsUrl,
							success: () => {
								console.log("WebSocket 发起连接成功");
								this.imageInfo = '暂无图像';
							},
							fail: (err) => {
								console.error("WebSocket 连接失败:", err);
								scheduleReconnect();
							},
						});
					}
					// 连接打开
					this.socketTask.onOpen(() => {
						console.log("WebSocket 连接已建立");
						this.reconnectAttempts = 0; // 重连计数清零
						if (this.reconnectTimer) {
							clearTimeout(this.reconnectTimer);
							this.reconnectTimer = null;
						}
					});

					// 接收消息
					this.socketTask.onMessage((res) => {
						try {
							const arrayBuffer = res.data;
							const uint8Array = new Uint8Array(arrayBuffer);

							// 尝试用 TextDecoder 解码
							let text = "";
							if (typeof TextDecoder !== "undefined") {
								const decoder = new TextDecoder("utf-8");
								text = decoder.decode(uint8Array);
							} else {
								// fallback 分块解码
								let CHUNK_SIZE = 0x8000;
								for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
									text += String.fromCharCode.apply(
										null,
										uint8Array.subarray(i, i + CHUNK_SIZE)
									);
								}
							}
							const json = JSON.parse(text);
							const data = json.data || {};
							if (this.currentStep === 1 && this.stepCompleted === false) { //识别点云
								if (data.status === 0) {
									this.$task.stepCompleted = true;
									this.currentStepConfig.status = 'COMPLETED';
								} else if (data.status === 2) { //异常
									this.currentStepConfig.status = 'ERROR';
									this.$task.stepCompleted = true;
								}
							} else if (this.currentStep === 2 && this.startIdentify === true && this
								.stepCompleted === false) { //识别焊缝
								if (data.status === 0) { //结束
									// this.callRenderMethod('initMarkers');
									const {
										weld_datas = []
									} = data || {};
									console.log('weld_datas', weld_datas)
									if (!weld_datas || weld_datas.length === 0) {
										uni.showToast({
											title: "未识别到焊缝",
											icon: "error",
											duration: 1500,
										});
										this.$task.stepCompleted = true;
										this.$task.currentStep = 1;
										this.currentStepConfig.status = 'COMPLETED';
									} else {
										this.$task.weldList = this.combineWeldData(data);
										console.log("整理后的结果", this.$task.weldList);
										this.$task.stepCompleted = true;
										this.currentStepConfig.status = 'COMPLETED';
									}

								} else if (data.status === 2) { //异常
									this.currentStepConfig.status = 'ERROR';
									this.$task.stepCompleted = true;
								}

							} else if (this.currentStep === 4 || this.currentStep === 5) {
								console.log('data', data);
								if (!('weld_id' in data) && data.status === 0) {
									this.currentStepConfig.status = 'COMPLETED';
									this.$task.stepCompleted = true;


									// if(this.currentStep === 4){
									// 	this.$task.currentStep=0;
									// }
									return;
								}
								this.updateWeldStatus(data.weld_id, data.status);
							} else if (this.currentStep === 6 && this.startIdentify === true && this
								.stepCompleted === false) { //更新焊缝
								console.log('ws更新焊缝')
								console.log('data', data);
								if (data.status === 0) { //结束
									const {
										weld_datas = []
									} = data || {};
									console.log('weld_datas', weld_datas)
									if (!weld_datas || weld_datas.length === 0) {
										uni.showToast({
											title: "保存失败",
											icon: "error",
											duration: 1500,
										});
										this.$task.stepCompleted = true;
										this.$task.stepTrigger++;
										this.$task.currentStep = 3;
										this.$task.editMode = false;
										this.currentStepConfig.status = 'COMPLETED';
									} else { //将内容更新到weldList
										this.$task.weldList = this.$task.weldList.map(w => {
											// 在新 weld_datas 中查找匹配 id 的新对象
											const updated = weld_datas.find(n => n.weld_id === w
												.weld_id);
											if (updated) {
												//将updated中this.$task.currentWeld没有的属性复制给updated
												Object.keys(this.$task.currentWeld).forEach(key => {
													if (!(key in updated)) {
														updated[key] = this.$task.currentWeld[
															key];
													}
												});
console.log('更新焊缝',updated.id)
console.log('更新焊缝',updated.weld_positions)
											}
											return updated ? updated : w;
										});

										this.$task.stepTrigger++;
										this.$task.currentWeld = {}
										this.printWeldInfo();
										this.$task.currentStep = 3;
										this.$task.stepCompleted = false;
										this.$task.editMode = false;
										
									}
									this.$task.showImage = false;
								} else if (data.status === 2) { //异常
									this.currentStepConfig.status = 'ERROR';
									this.$task.stepCompleted = true;
								}
							}
						} catch (e) {
							console.error("解析消息失败:", e);
						}
					});

					// 连接错误
					this.socketTask.onError((err) => {
						console.error("WebSocket 错误:", err.message);
						scheduleReconnect();
					});

					// 连接关闭
					this.socketTask.onClose(() => {
						console.log("WebSocket 连接关闭");
						this.stopImageLoop();
						scheduleReconnect();
					});
					const scheduleReconnect = () => {
						this.imageInfo = '正在重连...';
						if (this.reconnectAttempts >= this.maxReconnectAttempts) {
							console.error("WebSocket 达到最大重连次数，停止重连");
							return;
						}
						if (this.reconnectTimer) return; // 避免重复定时器

						const timeout = Math.min(1000 * 2 ** this.reconnectAttempts, 30000); // 指数退避，最大30秒
						console.log(`WebSocket ${this.reconnectAttempts + 1} 次重连，${timeout}ms 后尝试连接`);
						this.reconnectTimer = setTimeout(() => {
							this.reconnectAttempts++;
							this.reconnectTimer = null;
							createSocket();
						}, timeout);
					};
				};
				createSocket();
			},
			closeWebSocket() {
				if (this.socketTask) {
					this.socketTask.close({
						success: () => {
							console.log("WebSocket 已关闭");
							this.cameraImage = null;
							this.socketTask = null;
						},
					});
				}
			},
			handlePointCloudInit() {
				const deviceIp = uni.getStorageSync("device_ip").split(":")[0];
				this.callRenderMethod('initPrintClouds', deviceIp);
			},
			printWeldInfo() {
				if (!Array.isArray(this.$task.weldList)) {
					console.warn('weldList 不是数组');
					return;
				}

				console.log('==== 焊缝关键信息打印 ====');

				this.$task.weldList.forEach((w, index) => {
					console.log(`焊缝 ${index + 1} | weld_id = ${w.weld_id}`);

					console.log('camera_position:', w.camera_position);

					console.log('weld_pixel_coordinate:', w.weld_pixel_coordinate);

					console.log('weld_positions:', w.weld_positions);

					console.log();
				});
				console.log('==== 焊缝关键信息打印结束 ====');

			},
			startIdentifyTask() { //开始识别
				console.log("startIdentifyTask");
				//1.获取当前机械臂位置
				const deviceIp = uni.getStorageSync("device_ip").split(":")[0];
				this.$sql
					.getRobotPosition(deviceIp)
					.then((res) => {
						console.log("res", res);
						if (res == null) {
							uni.showToast({
								title: "获取当前机械臂位置失败",
								icon: "error", // success / none / loading / error (部分平台不支持 error)
								duration: 1500,
							});
							this.$task.currentStep = 1; //返回识别前一步
							return;
						}
						console.log("res.position", res.init_position);
						const position = JSON.parse(res.init_position);
						console.log("position", position);
						const param = this.concatIdentifyParam(position); //拼接参数
						this.$rest
							.stratIdentify(param)
							.then((res) => {
								console.log("开始焊缝识别结果", res);
								if (res.data.weld_detection_status) {
									this.startIdentify = true;
									this.callRenderMethod('clearArrows');
								} else {
									uni.showToast({
										title: "识别焊缝启动失败",
										icon: "error", // success / none / loading / error (部分平台不支持 error)
										duration: 1500,
									});
									this.$task.currentStep = 1;
								}
							})
							.catch((err) => {});
					})
					.catch((err) => {
						console.log("获取机械臂位置失败", err);
						uni.showToast({
							title: "获取当前机械臂位置失败",
							icon: "error", // success / none / loading / error (部分平台不支持 error)
							duration: 1500,
						});
						this.$task.currentStep = 1; //返回识别前一步
					});
			},
			concatIdentifyParam(raw) {
				const param = {
					type: "weld_detection",
					original_point: {
						tool: "1",
						rx: raw.rx,
						ry: raw.ry,
						rz: raw.rz,
						x: raw.x,
						y: raw.y,
						z: raw.z,
					},
				};
				return {
					channel: "RestChannel",
					node: "weld",
					data: param,
				};
			},
			combineWeldData(data) {
				const {
					weld_datas = []
				} = data;
				const result = weld_datas.map((item) => {
					return {
						id: item.weld_id,
						appId: item.weld_id,
						name: `焊缝 ${item.weld_id}`,
						...item
					};
				});

				return result;
			},
			stopImageLoop() {
				if (this.timer) {
					clearInterval(this.timer);
					this.timer = null;
				}
			},
			// changeParam(param) {
			// 	this.weld_param = param;
			// 	if (param && Object.keys(param).length > 0) {
			// 		this.isParamSet = false;
			// 	}
			// 	console.log("changeParam", this.weld_param);
			// },
			handleStartIdentify() {
				//返回到设置焊缝类型阶段
				this.$task.currentStep = 0;
				this.resetLocalData();
			},
			resetLocalData() {
				//重置本地数据
				this.cameraImage = null;
				//   this.currentStep = 0;
				this.status = null;
				// this.identityData = [];
				this.startIdentify = false;
				this.weld_class = "";
				this.weld_param = {};
				if (this.timer) {
					clearInterval(this.timer);
					this.timer = null;
				}
			},
			startTask() {
				//开始焊接
				if (this.$task.weldList.length === 0) {
					uni.showToast({
						title: "当前未识别到焊缝",
						icon: "none",
					});
					return;
				}
				this.initWeldList();
				const deviceIp = uni.getStorageSync("device_ip").split(":")[0];
				this.$sql
					.getRobotPosition(deviceIp)
					.then((res) => {
						if (res == null) {
							uni.showToast({
								title: "获取当前机械臂位置失败",
								icon: "error",
								duration: 1500,
							});
						}
						const position = JSON.parse(res.init_position);
						const data = this.concatWeldingParam(this.simulateFlag);
						console.log('startTask data', data);
						this.$rest
							.startTask(position, data)
							.then((res) => {
								console.log("开始焊接结果", res);
								if (res.data && res.data.weld_start_status) {
									this.initWeldList();
									const titleStr = this.simulateFlag ?
										"模拟任务已开始" :
										"任务已开始";

								} else {
									const titleStr = this.simulateFlag ?
										"模拟启动失败" :
										"启动失败";
									uni.showToast({
										title: titleStr,
										icon: "error",
									});
								}
							})
							.catch((err) => {});
					})
					.catch((err) => {});
			},
			//构造请求数据
			concatWeldingParam(simulateFlag) {
				// console.log('this.$task.weldList', this.$task.weldList);
				const result = this.$task.weldList.map((item) => ({
					weld_id: item.weld_id,
					weld_length: item.weld_length,
					path_index: item.path_index,
					weld_index_in_path: item.weld_index_in_path,
					weld_positions: item.weld_positions,
					weld_type: item.weld_type,
					simulate: simulateFlag,
					welding_current: this.$task.weldParam.electric,
					welding_correction_voltage: this.$task.weldParam.voltage,
					welding_swing: this.$task.weldParam.amplitude,
					welding_speed: this.$task.weldParam.speed,
				}));
				console.log('result', result);
				return result;
			},
			resetRobot() {
				//重置机械臂
				const deviceIp = uni.getStorageSync("device_ip").split(":")[0];
				this.$sql.getRobotPosition(deviceIp).then((res) => {
					var position = {
						rx: 0,
						ry: 0,
						rz: 0,
						x: 0,
						y: 0,
						z: 0,
					};
					if (res && res != null) {
						position = res;
					}
					console.log("重置机械臂位置", position);
					const param = {
						tool: "1",
						rx: position.rx,
						ry: position.ry,
						rz: position.rz,
						x: position.x,
						y: position.y,
						z: position.z,
					};
					this.$rest
						.resetRobot(param)
						.then((res) => {
							console.log("重置机械臂结果", res);
							if (res.return_status || res.data.return_status) {
								uni.showToast({
									title: "机械臂已重置",
									icon: "success",
								});
								// this.resetLocalData();
							} else {
								uni.showToast({
									title: "重置机械臂失败",
									icon: "error",
								});
							}
						})
						.catch((err) => {});
				}).catch(err => {
					console.log(err);
				});
			},
			updateWeldStatus(weld_id, status) {
				console.log('weld_id', weld_id);
				console.log('status', status);
				const statusMap = ["done", "in_progress", "error"];
				const statStr = statusMap[status] ? statusMap[status] : "waiting";
				console.log('statStr', statStr);
				const weld = this.$task.weldList.find(w => w.id == weld_id);
				console.log('weld', weld);
				if (weld) {
					weld.status = statStr; // 直接修改目标对象
				}
				console.log('weld', weld);
			},
			initWeldList() {
				// 初始化焊接列表
				this.$task.weldList = this.$task.weldList.map((item) => ({
					...item,
					status: "waiting", // 初始状态为等待
				}));
				console.log('initWeldList', this.$task.weldList);
			},
			handleGotoSteps(index) {
				console.log('index', index);
				console.log('weldList', this.weldList);
				this.$task.currentStep = index;
			},
			handleNavChange(msg) {
				// console.log('接收到了',msg);
				this.navigate_route = msg;
			},
			fangda() {
				this.callRenderMethod('fangda');
			},
			generateMarkedImages() {
				this.callRenderMethod('markedImages', this.$task.weldList);
			},
			handleMarkedImages(list) {
				this.printWeldInfo()
				this.$task.weldList = list
				this.printWeldInfo()
				this.$task.stepCompleted = true;
			},
			handleLineDrawn(line) {
				console.log('划线坐标:', line);
				// line = { x1, y1, x2, y2 }
				// this.lines = line;
			},
			handleClearLines() {
				// this.lines = []
				this.lineCommand = {
					cmd: 'clearLines',
					time: Date.now()
				};
			},


		},
	};
</script>

<style lang="scss" scoped>
	.camera-view {
		position: relative;
		width: 100%;
		height: 100vh;
		/* 或者你需要的高度 */
		overflow: hidden;
	}

	.zoom {
		// background-color: white;
		// color: white;
		width: 20px;
		height: 20px;
		z-index: 999;
		position: absolute;
		/* 绝对定位 */
		top: 30px;
		/* 距离顶部 0 */
		left: 40px;
		/* 距离右边 0 */
	}

	.message-card {
		width: 80%;
		height: 90rpx;
		margin: 0 auto;
		margin-top: 12px;
	}

	.navi-top {
		position: absolute;
		/* 绝对定位 */
		top: 20rpx;
		/* 距离顶部 0 */
		right: 20rpx;
		z-index: 999;
		/* 距离右边 0 */
	}


	.left-bottom {
		position: fixed;
		/* 或 absolute，取决于是否有滚动容器 */
		bottom: 0;
		border-radius: 12rpx;
		z-index: 1000;
		.navigate-card {
			width: 800rpx;
		}
	}

	.fullscreen {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 999;
		/* 需要时可调层级 */
	}

	.monitor {
		width: 100%;
		height: 100%;
		z-index: 99;
	}
</style>
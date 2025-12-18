// sql.js
// import weldControllerInfo from './weldControllerInfo';
// import weldJobConfig from './weldJobConfig';
import {
	uuid
} from '@/utils/uuid.js'
const sql = {
	weldJobConfig: 'weld_job_config.db',
	weldControllerInfo: 'weld_controller_info.db',
	initSqls: [{
			dbName: 'weld_job_config.db',
			sql: `CREATE TABLE IF NOT EXISTS weld_job_config (  --焊接工艺包配置表
      uuid VARCHAR(255) PRIMARY KEY NOT NULL,       -- 主键，唯一标识
      name VARCHAR(256) NOT NULL,                   -- 工艺包名称
      amplitude VARCHAR(36),                         -- 焊枪摆幅
      electric VARCHAR(36),                          -- 焊机电流
      voltage VARCHAR(20),                           -- 焊机弧长校正电压
      speed VARCHAR(36),                             -- 焊枪行进速度
      create_time VARCHAR(20),                       -- 创建时间
      update_time VARCHAR(20)                        -- 更新时间
    );`
		},
		{
			dbName: 'weld_controller_info.db',
			sql: `CREATE TABLE IF NOT EXISTS weld_controller_info ( -- 控制器设备信息表
      uuid VARCHAR(255) PRIMARY KEY NOT NULL,        -- 主键，唯一标识
      controller_id VARCHAR(36) NOT NULL,            -- 控制器设备id
      controller_ip VARCHAR(16),                      -- 控制器IP地址
      init_position VARCHAR(1024),                    -- 机器人初始位置参数（JSON格式）
      created_time VARCHAR(20),                       -- 创建时间
      last_con_time VARCHAR(20)                       -- 最近连接时间
    );`
		}
	],
	// 打开数据库（内部自动判断）
	openDatabase(dbName) {
		return new Promise((resolve, reject) => {
			if (plus.sqlite.isOpenDatabase({
					name: dbName,
					path: `_doc/${dbName}`
				})) {
				// 已经打开
				console.log('✅ 数据库已经打开:' + dbName.toString());
				return resolve();
			}
			plus.sqlite.openDatabase({
				name: dbName,
				path: `_doc/${dbName}`,
				success: () => {
					console.log('✅ 数据库打开成功:' + dbName);
					resolve();
				},
				fail: e => {
					console.error('❌ 数据库打开失败', e);
					reject(e);
				}
			});
		});
	},

	// 判断是否打开
	isOpenDatabase(dbName) {
		return plus.sqlite.isOpenDatabase({
			name: dbName,
			path: `_doc/${dbName}`
		});
	},

	// 关闭数据库
	closeDatabase(dbName) {
		return new Promise((resolve, reject) => {
			plus.sqlite.closeDatabase({
				name: dbName,
				success: () => {
					console.log('✅ 数据库关闭成功');
					resolve();
				},
				fail: e => reject(e)
			});
		});
	},

	// 执行增删改
	executeSql(dbName, sqlStr) {
		return this.openDatabase(dbName).then(() => {
			return new Promise((resolve, reject) => {
				console.log(sqlStr);
				plus.sqlite.executeSql({
					name: dbName,
					sql: sqlStr,
					success: () => resolve(),
					fail: e => reject(e)
				});
			});
		});
	},

	// 查询
	selectSql(dbName, sqlStr) {
		return this.openDatabase(dbName).then(() => {
			return new Promise((resolve, reject) => {
				console.log(sqlStr);
				plus.sqlite.selectSql({
					name: dbName,
					sql: sqlStr,
					success: data => resolve(data),
					fail: e => reject(e)
				});
			});
		});
	},

	// 执行事务
	transaction(dbName, sqlList = []) {
		// sqlList 格式: [ { sql: 'INSERT ...', params: [] }, { sql: 'UPDATE ...', params: [] } ]
		if (!Array.isArray(sqlList) || sqlList.length === 0) {
			return Promise.reject(new Error('事务 SQL 列表不能为空'));
		}

		return this.openDatabase(dbName).then(() => {
			return new Promise((resolve, reject) => {
				plus.sqlite.transaction({
					name: dbName,
					operation: () => {
						const promises = sqlList.map(item =>
							new Promise((res, rej) => {
								plus.sqlite.executeSql({
									name: dbName,
									sql: item.sql,
									success: () => res(),
									fail: e => rej(e)
								});
							})
						);

						Promise.all(promises)
							.then(() => {
								console.log('✅ 事务执行成功');
								resolve();
							})
							.catch(err => {
								console.error('❌ 事务执行失败', err);
								reject(err);
							});
					},
					fail: e => reject(e)
				});
			});
		});
	},

	//创建表
	async initDatabase() {
		try {
			for (const item of this.initSqls) {
				// 依次执行建表语句，确保顺序
				await this.executeSql(item.dbName, item.sql);
			}
			console.log('数据库初始化完成');
		} catch (e) {
			console.error('数据库初始化失败', e);
		}
	},
	// 获取当前格式化时间
	formatTime(date = new Date()) {
		const pad = n => n.toString().padStart(2, '0');
		const y = date.getFullYear();
		const m = pad(date.getMonth() + 1);
		const d = pad(date.getDate());
		const h = pad(date.getHours());
		const min = pad(date.getMinutes());
		const s = pad(date.getSeconds());
		return `${y}-${m}-${d} ${h}:${min}:${s}`;
	},

	// 全 0 初始位置 JSON
	defaultInitPosition() {
		return JSON.stringify({
			x: 0,
			y: 0,
			z: 0,
			rx: 0,
			ry: 0,
			rz: 0
		});
	},

	//更新设备信息 

	// 插入或更新设备信息
	insertOrUpdateDevice(deviceIp) {
		// #ifdef APP-PLUS
		const now = this.formatTime();

		return this.selectSql(this.weldControllerInfo,
			`SELECT uuid FROM weld_controller_info WHERE controller_ip = '${deviceIp}'`
		).then(rows => {
			if (rows.length === 0) {
				// 不存在 → 插入
				const id = uuid();
				const controller_id = uuid();
				const sql = `
				  INSERT INTO weld_controller_info 
				  (uuid, controller_id, controller_ip, init_position, created_time, last_con_time)
				  VALUES (
				    '${id}',
				    '${controller_id}',
				    '${deviceIp}',
				    '${this.defaultInitPosition()}',
				    '${this.formatTime()}',
				    '${this.formatTime()}'
				  )
				`;
				return this.executeSql(this.weldControllerInfo, sql).then(() => {
					console.log(`✅ 新增设备成功`);
				}).catch(err => {
					console.log(err.message)
				});
			} else {
				// 存在 → 更新 last_con_time
				return this.executeSql(this.weldControllerInfo,
					`UPDATE weld_controller_info SET last_con_time = '${now}' WHERE controller_ip = '${deviceIp}'`
				).then(() => {
					console.log(`♻ 更新设备  的 last_con_time 成功`);
				});
			}
		}).catch(err => {
			console.error("❌ 插入或更新设备失败", err.message);
		});
		// #endif

		// #ifdef WEB
		// 在 H5 里没有 sqlite，返回一个模拟的 Promise
		return Promise.resolve();
		// #endif
	},


	//查询初始位姿
	getRobotPosition(deviceIp) {
		// #ifdef APP-PLUS
		console.log('11111')
		return this.selectSql(this.weldControllerInfo,
			`select * from weld_controller_info  where controller_ip= '${deviceIp}'`).then(
			res => {
				if (res && res.length > 0) {
					return res[0]; // 返回第一个结果
				}
				return null; // 如果没有结果，返回 null
			}).catch(err => {
			console.error('❌ 查询初始位姿失败', err);
			throw err; // 抛出错误以便上层处理
		});
		// #endif

		// #ifdef WEB
		console.log('22222')
		// 在 H5 里没有 sqlite，返回一个模拟的 Promise
		return Promise.resolve({
			'init_position':`{
  "x": 0,
  "y": 0,
  "z": 0,
  "rx": 0,
  "ry": 0,
  "rz": 0
}`
		});
		// #endif
	},
	// 重置初始位姿
	resetRobotPosition(deviceIp, position) {
		return this.executeSql(this.weldControllerInfo,
			`UPDATE weld_controller_info SET init_position = '${JSON.stringify(position)}' WHERE controller_ip = '${deviceIp}'`
		).then(() => {
			console.log(`✅ 重置初始位姿成功`);
		}).catch(err => {
			console.error('❌ 重置初始位姿失败', err.message);
			throw err; // 抛出错误以便上层处理
		});
	},
	// 获取所有工艺包配置
	getAllWeldParams() {
		// #ifdef APP-PLUS
		const sql = `SELECT * FROM weld_job_config ORDER BY create_time DESC`;
		return this.selectSql(this.weldJobConfig, sql)
			.then(results => {
				console.log('✅ 查询工艺包成功', results);
				return results;
			})
			.catch(err => {
				console.error('❌ 查询工艺包失败', err.message);
				throw err;
			});
		// #endif

		// #ifdef WEB
		// 在 H5 里没有 sqlite，返回一个模拟的 Promise
		return Promise.resolve([
  {
    "uuid": "1",
    "name": "标准焊接工艺包A",
    "amplitude": "10",
    "electric": "120",
    "voltage": "24",
    "speed": "15",
    "create_time": "2025-09-25 10:00:00",
    "update_time": "2025-09-25 10:05:00"
  },
  {
    "uuid": "2",
    "name": "高强度焊接工艺包B",
    "amplitude": "12",
    "electric": "140",
    "voltage": "26",
    "speed": "12",
    "create_time": "2025-09-24 09:30:00",
    "update_time": "2025-09-24 09:45:00"
  },
  {
    "uuid": "3",
    "name": "轻量化焊接工艺包C",
    "amplitude": "8",
    "electric": "100",
    "voltage": "22",
    "speed": "18",
    "create_time": "2025-09-23 14:20:00",
    "update_time": "2025-09-23 14:35:00"
  }
]
);
		// #endif	
	},
	//添加工艺包参数
	addWeldParam(formData) {
		// #ifdef APP-PLUS
		// 获取当前时间戳作为 create_time / update_time
		const timestamp = this.formatTime();;

		// 生成 uuid，可以用随机数或库生成
		const uuId = uuid();
		const selectSql=`select * from weld_job_config where name = '${formData.name}'  `;
		
		this.executeSql(this.weldJobConfig, sql).then((res)=>{
			console.log('selectSql',res)
		}).catch(err => {
				console.log('', err.message);
				throw err;
			});
		// 构造 SQL 插入语句
		const sql = `
	      INSERT INTO weld_job_config (
	        uuid, name, amplitude, electric, voltage, speed, create_time, update_time
	      ) VALUES (
	        '${uuId}',
	        '${formData.name}',
	        '${formData.amplitude}',
	        '${formData.electric}',
	        '${formData.voltage }',
	        '${formData.speed }',
	        '${timestamp}',
	        '${timestamp}'
	      );
	    `;

		// 执行 SQL
		return this.executeSql(this.weldJobConfig, sql)
			.then(() => {
				console.log('✅ 新增工艺包成功');
			})
			.catch(err => {
				console.error('❌ 新增工艺包失败', err.message);
				throw err;
			});
		// #endif

		// #ifdef WEB
		// 在 H5 里没有 sqlite，返回一个模拟的 Promise
		return Promise.resolve().then(() => {
			console.log(`🌐(H5模拟) 已更新 uuid=${formData.uuid} 的工艺包`);
			return true; // 保证返回值类型一致
		});
		// #endif
	},
	// 删除
	deleteParam(formData) {
		// #ifdef APP-PLUS
		const sql = `
	    DELETE FROM weld_job_config
	    WHERE uuid = '${formData.uuid}';
	  `;

		return this.executeSql(this.weldJobConfig, sql)
			.then(() => {
				console.log(`🗑️ 已删除 uuid=${formData.uuid} 的工艺包`);
			})
			.catch(err => {
				console.error('❌ 删除工艺包失败', err.message);
				throw err;
			});
		// #endif

		// #ifdef WEB
		// 在 H5 里没有 sqlite，返回一个模拟的 Promise
		return Promise.resolve().then(() => {
			console.log(`🌐(H5模拟) 已更新 uuid=${formData.uuid} 的工艺包`);
			return true; // 保证返回值类型一致
		});
		// #endif

	},

	// 修改
	updateWeldParam(formData) {
		// #ifdef APP-PLUS
		const timestamp = this.formatTime();

		const sql = `
	    UPDATE weld_job_config
	    SET
	      name = '${formData.name}',
	      amplitude = '${formData.amplitude}',
	      electric = '${formData.electric}',
	      voltage = '${formData.voltage}',
	      speed = '${formData.speed}',
	      update_time = '${timestamp}'
	    WHERE uuid = '${formData.uuid}';
	  `;

		return this.executeSql(this.weldJobConfig, sql)
			.then(() => {
				console.log(`✏️ 已更新 uuid=${formData.uuid} 的工艺包`);
			})
			.catch(err => {
				console.error('❌ 更新工艺包失败', err.message);
				throw err;
			});
		// #endif

		// #ifdef WEB
		// 在 H5 里没有 sqlite，返回一个模拟的 Promise
		return Promise.resolve().then(() => {
			console.log(`🌐(H5模拟) 已更新 uuid=${formData.uuid} 的工艺包`);
			return true; // 保证返回值类型一致
		});
		// #endif
	},
	// 验证是否重复
	validWeldParam(name) {
		// #ifdef APP-PLUS
		const timestamp = this.formatTime();
		const sql = `
	    select *
	    from weld_job_config
	    WHERE name = '${name}';
	  `;
	
		return this.selectSql(this.weldJobConfig, sql)
			.then(results => {
				console.log('✅ 查询工艺包成功', results);
				if(Array.isArray(results) && results.length >= 1){
					return false;
				}else{
					return true;
				}
				
			})
			.catch(err => {
				console.error('❌ 查询工艺包失败', err.message);
				throw err;
			});
		// #endif
	
		// #ifdef WEB
		// 在 H5 里没有 sqlite，返回一个模拟的 Promise
		return Promise.resolve().then(() => {
			console.log(`🌐(H5模拟) 已更新 uuid=${formData.uuid} 的工艺包`);
			return true; // 保证返回值类型一致
		});
		// #endif
	}
};

export default sql;
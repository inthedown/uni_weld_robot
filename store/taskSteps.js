import Vue from 'vue';

function createStep({
	index,
	name,
	icon,
	dependencies = [],
	button
}) {
	return {
		index,
		name,
		icon,
		status: 'WAIT', //WAIT COMPLETED ERROR
		dependencies,
		button,
		excuteFlag:false,
		canExecute() {
			return this.dependencies.every(depIndex => {
				const depStep = Vue.prototype.$task.steps.find(s => s.index === depIndex)
				return depStep.status === 'COMPLETED'
			})||this.excuteFlag
		},
		reset() {
			this.status = 'WAIT';
			this.excuteFlag = false;
		}
	}
}

export const TaskSteps = Vue.observable({
	currentStep: 0,
	stepTrigger: 0,
	stepCompleted:true,
	hasBuiltPointCloud:false,
	mode:"steps",
	currentWeld:{},
	editMode:false,
	showImage:false,
	steps: [
		createStep({
			index: 1,
			name: '建立点云',
			icon: 'operate_focus',	
			button:[{type:'primary',text:'识别焊缝'}]
		}),
		createStep({
			index: 2,
			name: '识别焊缝',
			icon: 'operate_identity',
			dependencies: [1],
			button:[{type:'primary',text:'编辑焊缝'}]
		}),
		createStep({
			index: 3,
			name: '编辑焊缝',
			icon: 'operate_edit',
			dependencies: [1,2],
			button:[{type:'info',text:'模拟焊接'},{type:'primary',text:'开始焊接'}]
		}),
		createStep({
			index: 4,
			name: '模拟焊接',
			icon: 'operate_simulate',
			dependencies: [1, 2,3],
			button:[{type:'info',text:'工艺包配置'},{type:'info',text:'模拟焊接'},{type:'primary',text:'开始焊接'}]
			
		}),
		createStep({
			index: 5,
			name: '开始焊接',
			icon: 'operate_weld',
			dependencies: [1, 2,3],
			button:[{type:'info',text:'再次焊接'},{type:'primary',text:'建立点云'}]
		})
	],
	weldList:[],
	weldParam:{},
	isParamSet:false,
	reset() {
		this.currentStep = 0;
		this.stepCompleted=true;
		this.hasBuiltPointCloud=false;
		this.steps.forEach(s => s.reset())
	},
	updateFinalStatus(){
		this.steps.forEach(s => {
			if(s.index!=5){
				s.reset();
			}else{
				s.excuteFlag=true;
			}
		})
	},
	get progress() {
		const total = this.steps.length
		const completed = this.steps.filter(s => s.status === 'COMPLETED').length
		return Math.round((completed / total) * 100)
	}
})
// 引入API模块
import { repairApi } from '../../utils/api/repair.js';
import { maintenanceApi } from '../../utils/api/maintenance.js';
import { deviceWorkOrderApi } from '../../utils/api/device-work-order.js';
import { formatDate } from '../../utils/util.js';

Page({
  data: {
    orderId: '',
    orderInfo: null,
    isLoading: true,
    orderType: 'REPAIR', // 默认为维修工单
    showHandleForm: false, // 是否显示处理信息表单
    handleFormData: { // 处理信息表单数据
      handle_description: '',
      solution_description: '',
      used_materials: ''
    },
    // 验收弹窗相关数据
    showAcceptanceModal: false,
    submittingAcceptance: false,
    acceptanceFormData: {
      is_passed: true,
      score: null,
      acceptance_description: ''
    },
    scoreOptions: [
      { value: 90, label: '优秀 (90分)' },
      { value: 80, label: '良好 (80分)' },
      { value: 70, label: '合格 (70分)' },
      { value: 60, label: '基本合格 (60分)' },
      { value: 50, label: '不合格 (50分)' }
    ],
    selectedScoreIndex: -1,
    selectedScoreLabel: ''
  },

  onLoad: function (options) {
    if (options.id) {
      // 设置工单类型，MAINTENANCE表示保养工单，REPAIR或其他值表示维修工单
      const orderType = options.type || 'REPAIR';
      
      this.setData({
        orderId: options.id,
        orderType: orderType
      });
      
      // 根据工单类型加载不同的工单详情
      this.loadOrderDetail(options.id, orderType);
    }
  },
  
  loadOrderDetail: function (orderId, orderType) {
    wx.showLoading({
      title: '加载中...'
    });
    
    // 根据工单类型调用不同的API
    if (orderType === 'MAINTENANCE') {
      this.loadMaintenanceOrderDetail(orderId);
    } else {
      this.loadRepairOrderDetail(orderId);
    }
  },
  
  // 加载维修工单详情
  loadRepairOrderDetail: function(orderId) {
    repairApi.getRepairOrderDetail(orderId)
      .then(res => {
        wx.hideLoading();
        
        if (res && res.code === 200 && res.data) {
          // 格式化工单数据
          const orderData = res.data;
          
          // 获取全局配置
          const app = getApp();
          const staticUrl = app.globalData.staticUrl || '';
          const isDev = app.globalData.isDev || false;
          
          // 格式化工单状态文本
          const statusMap = {
            'unassigned': '待分配',
            'pending': '待执行',
            'in_progress': '执行中',
            'completed': '已完成',
            'accepted': '已验收',
            'canceled': '已取消'
          };
          
          // 格式化紧急程度
          const urgencyMap = {
            'low': '低',
            'medium': '中',
            'high': '高',
            'urgent': '紧急'
          };
          
          // 格式化故障类型
          const faultTypeMap = {
            'mechanical': '机械故障',
            'electrical': '电气故障',
            'software': '软件故障',
            'other': '其他故障'
          };
          
          // 构建页面所需的工单数据结构
          const formattedOrder = {
            id: orderData.id,
            deviceId: orderData.device_id,
            deviceName: orderData.device_name,
            deviceLocation: orderData.location || '未知位置',
            faultType: orderData.fault_type,
            faultTypeText: faultTypeMap[orderData.fault_type] || orderData.fault_type || '未知',
            faultDesc: orderData.description,
            urgency: orderData.urgency_level || 'medium',
            status: orderData.status,
            statusText: statusMap[orderData.status] || '未知状态',
            urgencyText: urgencyMap[orderData.urgency_level] || '一般',
            reporter: orderData.creator_name,
            contactPhone: orderData.creator_phone,
            reportTime: formatDate(orderData.created_at),
            handler: orderData.assigned_to_name,
            assigned_to: orderData.assigned_to,
            handleTime: formatDate(orderData.assigned_time),
            handleDesc: orderData.handle_description,
            actualStart: formatDate(orderData.actual_start),
            actualEnd: formatDate(orderData.actual_end),
            completeTime: formatDate(orderData.completed_at),
            solutionDesc: orderData.solution_description,
            usedMaterials: orderData.used_materials || '无',
            orderType: 'REPAIR', // 设置工单类型为维修工单
            hasStarted: !!orderData.actual_start, // 根据实际开始时间判断是否已开始
            // 添加验收信息
            acceptance: orderData.acceptance || null
          };
          
          // 获取工单图片
          if (orderData.images && orderData.images.length > 0) {
            console.log('工单包含图片数据:', orderData.images);
            
            // 确保图片URL格式正确
            formattedOrder.faultImages = orderData.images.map(img => {
              // 获取图片URL
              let imgUrl = img.url || img.file_path || img;
              
              // 确保URL格式正确
              if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
                imgUrl = '/' + imgUrl;
              }
              
              // 如果URL不包含/mes前缀，添加它
              if (imgUrl && !imgUrl.startsWith('/mes/') && imgUrl.includes('/uploads/')) {
                imgUrl = '/mes' + imgUrl;
              }
              
              // 添加静态资源域名前缀
              if (imgUrl && imgUrl.startsWith('/')) {
                imgUrl = staticUrl + imgUrl;
              }
              
              console.log(`处理后的图片URL [${isDev ? '开发环境' : '生产环境'}]:`, imgUrl);
              return imgUrl;
            });
            
            console.log('维修工单详情数据:', formattedOrder);
            console.log('验收信息:', formattedOrder.acceptance);
            this.setData({
              orderInfo: formattedOrder,
              isLoading: false
            });
          } else {
            console.log('工单不包含图片数据，尝试单独获取');
            // 如果API返回中没有包含图片信息，单独获取
            this.loadOrderImages(orderId, formattedOrder);
          }
        } else {
          this.showError('获取工单详情失败');
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('获取工单详情失败', err);
        this.showError('获取工单详情失败');
      });
  },
  
  // 加载保养工单详情
  loadMaintenanceOrderDetail: function(orderId) {
    maintenanceApi.getMaintenanceOrderDetail(orderId)
      .then(res => {
        wx.hideLoading();
        
        if (res && res.code === 200 && res.data) {
          // 格式化工单数据
          const orderData = res.data;
          
          // 格式化工单状态文本
          const statusMap = {
            'unassigned': '待分配',
            'pending': '待执行',
            'in_progress': '执行中',
            'completed': '已完成',
            'accepted': '已验收',
            'canceled': '已取消'
          };
          
          // 格式化优先级
          const priorityMap = {
            'low': '低',
            'medium': '中',
            'high': '高'
          };
          
          // 格式化保养类型
          const maintenanceTypeMap = {
            'routine': '常规保养',
            'preventive': '预防性保养',
            'corrective': '纠正性保养',
            'predictive': '预测性保养'
          };
          
          // 构建页面所需的工单数据结构
          const formattedOrder = {
            id: orderData.id,
            deviceId: orderData.device_id,
            deviceName: orderData.device_name,
            deviceLocation: orderData.location || '未知位置',
            maintenanceType: orderData.maintenance_type || 'routine',
            maintenanceTypeText: maintenanceTypeMap[orderData.maintenance_type] || '计划保养',
            description: orderData.description,
            priority: orderData.priority || 'medium',
            priorityText: priorityMap[orderData.priority] || '中',
            status: orderData.status,
            statusText: statusMap[orderData.status] || '未知状态',
            scheduledStart: formatDate(orderData.scheduled_start),
            scheduledEnd: formatDate(orderData.scheduled_end),
            actualStart: formatDate(orderData.actual_start),
            actualEnd: formatDate(orderData.actual_end),
            handler: orderData.assigned_to_name,
            assigned_to: orderData.assigned_to,
            handleTime: formatDate(orderData.assigned_time),
            handleDesc: orderData.handle_description,
            completeTime: formatDate(orderData.completed_at),
            solutionDesc: orderData.solution_description,
            usedMaterials: orderData.used_materials || '无',
            orderType: 'MAINTENANCE', // 设置工单类型为保养工单
            tasks: orderData.tasks || [], // 保养任务列表
            hasStarted: !!orderData.actual_start, // 根据实际开始时间判断是否已开始
            // 添加验收信息
            acceptance: orderData.acceptance || null
          };
          
          // 如果API返回中包含任务列表信息，直接使用
          if (orderData.tasks && orderData.tasks.length > 0) {
            console.log('保养工单详情数据:', formattedOrder);
            console.log('验收信息:', formattedOrder.acceptance);
            this.setData({
              orderInfo: formattedOrder,
              isLoading: false
            });
          } else {
            // 如果API返回中没有包含任务列表信息，单独获取
            this.loadMaintenanceTasks(orderId, formattedOrder);
          }
        } else {
          this.showError('获取保养工单详情失败');
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('获取保养工单详情失败', err);
        this.showError('获取保养工单详情失败');
      });
  },
  
  // 加载保养工单任务列表
  loadMaintenanceTasks: function(orderId, orderData) {
    maintenanceApi.getMaintenanceTasks(orderId)
      .then(res => {
        if (res && res.code === 200 && res.data) {
          // 将任务列表添加到工单数据中，并初始化任务的输入值
          const tasks = (res.data || []).map(task => ({
            ...task,
            inputActualTime: task.actual_time ? String(task.actual_time) : '',  // 如果有实际耗时，填充到输入框
            confirmed_actual_time: !!task.actual_time,  // 如果有实际耗时，设置为已确认
            skip_reason: task.skip_reason || '无需执行'  // 确保有跳过原因
          }));
          
          orderData.tasks = tasks;
        }
        
        this.setData({
          orderInfo: orderData,
          isLoading: false
        });
      })
      .catch(err => {
        console.error('获取保养任务列表失败', err);
        // 任务列表获取失败不影响整体功能，继续设置工单数据
        this.setData({
          orderInfo: orderData,
          isLoading: false
        });
      });
  },
  
  loadOrderImages: function(orderId, orderData) {
    // 获取工单图片
    repairApi.getWorkOrderImages(orderId)
      .then(res => {
        if (res && res.code === 200 && res.data) {
          console.log('原始图片数据:', res.data);
          
          // 获取全局配置
          const app = getApp();
          const staticUrl = app.globalData.staticUrl || '';
          const isDev = app.globalData.isDev || false;
          
          // 处理图片URL
          const imageUrls = res.data.map(img => {
            // 获取图片URL
            let imgUrl = img.url || img.file_path || img;
            
            // 确保URL格式正确
            if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
              imgUrl = '/' + imgUrl;
            }
            
            // 如果URL不包含/mes前缀，添加它
            if (imgUrl && !imgUrl.startsWith('/mes/') && imgUrl.includes('/uploads/')) {
              imgUrl = '/mes' + imgUrl;
            }
            
            // 添加静态资源域名前缀
            if (imgUrl && imgUrl.startsWith('/')) {
              imgUrl = staticUrl + imgUrl;
            }
            
            console.log(`处理后的图片URL [${isDev ? '开发环境' : '生产环境'}]:`, imgUrl);
            return imgUrl;
          });
          
          // 设置图片URL到工单数据中
          orderData.faultImages = imageUrls;
          
          // 更新页面数据
          this.setData({
            orderInfo: orderData,
            isLoading: false
          });
        } else {
          this.setData({
            orderInfo: orderData,
            isLoading: false
          });
        }
      })
      .catch(err => {
        console.error('获取工单图片失败:', err);
        // 图片获取失败不影响整体功能，继续设置工单数据
        this.setData({
          orderInfo: orderData,
          isLoading: false
        });
      });
  },
  
  showError: function(message) {
    wx.showToast({
      title: message,
      icon: 'none'
    });
    
    // 显示默认数据
    this.setData({
      orderInfo: {
        id: this.data.orderId,
        deviceName: '未知设备',
        deviceId: '未知',
        deviceLocation: '未知位置',
        status: 'pending',
        orderType: this.data.orderType // 保持工单类型
      },
      isLoading: false
    });
  },

  // 修改图片预览方法，适应safe-image组件
  previewImage: function (e) {
    const src = e.currentTarget.dataset.url || e.detail.src;
    if (!src) return;
    
    // 收集所有图片的本地路径用于预览
    const localImages = this.data.orderInfo.faultImages.filter(img => img);
    
    wx.previewImage({
      current: src,
      urls: localImages
    });
  },
  
  // 处理图片加载错误
  handleImageError: function(e) {
    console.error('图片加载失败:', e.detail);
    const index = e.currentTarget.dataset.index;
    
    // 获取失败的图片URL
    const failedUrl = this.data.orderInfo.faultImages[index];
    console.error('加载失败的图片URL:', failedUrl);
    
    wx.showToast({
      title: '部分图片加载失败',
      icon: 'none'
    });
  },

  // 接单处理
  handleOrder: function() {
    // 获取当前登录用户信息
    const userInfo = wx.getStorageSync('userInfo');
    
    if (!userInfo || !userInfo.id) {
      wx.showToast({
        title: '用户信息不完整，请重新登录',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '接单处理',
      content: '确定要接手该工单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...'
          });
          
          // 根据工单类型调用不同的API
          const apiPromise = this.data.orderInfo.orderType === 'MAINTENANCE' 
            ? maintenanceApi.acceptMaintenanceOrder(this.data.orderId, userInfo.id)
            : repairApi.acceptWorkOrder(this.data.orderId, userInfo.id);
          
          apiPromise.then(res => {
            wx.hideLoading();
            
            if (res && res.code === 200) {
              wx.showToast({
                title: '接单成功',
                icon: 'success',
                duration: 1500,
                success: () => {
                  // 延迟一下再刷新，让用户看到提示
                  setTimeout(() => {
                    // 刷新当前页面
                    this.loadOrderDetail(this.data.orderId, this.data.orderType);
                  }, 1500);
                }
              });
            } else {
              wx.showToast({
                title: res?.message || '接单失败，请重试',
                icon: 'none'
              });
            }
          })
          .catch(err => {
            wx.hideLoading();
            console.error('接单失败：', err);
            
            wx.showToast({
              title: '接单失败，请重试',
              icon: 'none'
            });
          });
        }
      }
    });
  },
  
  showHandleForm: function() {
    // 如果已有处理信息，则预填充表单
    const orderInfo = this.data.orderInfo;
    this.setData({
      showHandleForm: true,
      handleFormData: {
        handle_description: orderInfo.handleDesc || '',
        solution_description: orderInfo.solutionDesc || '',
        used_materials: orderInfo.usedMaterials || ''
      }
    });
  },
  
  hideHandleForm: function() {
    this.setData({
      showHandleForm: false
    });
  },

  // 处理说明输入事件
  onHandleDescInput: function(e) {
    this.setData({
      'handleFormData.handle_description': e.detail.value
    });
  },

  // 解决方案输入事件
  onSolutionDescInput: function(e) {
    this.setData({
      'handleFormData.solution_description': e.detail.value
    });
  },

  // 使用材料输入事件
  onUsedMaterialsInput: function(e) {
    this.setData({
      'handleFormData.used_materials': e.detail.value
    });
  },

  // 完成工单
  completeOrder: function() {
    wx.showModal({
      title: '完成工单',
      content: '确定已完成处理此工单？',
      success: (res) => {
        if (res.confirm) {
          // 打开处理信息填写表单
          this.completeEntireOrder();
        }
      }
    });
  },
  
  // 提交处理表单
  submitHandleForm: function() {
    // 验证表单数据
    const formData = this.data.handleFormData;
    if (!formData.handle_description) {
      wx.showToast({
        title: '请填写处理说明',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '提交中...'
    });
    
    // 构建完成数据
    const completionData = {
      actual_end: formatDate(new Date()),
      handle_description: formData.handle_description,
      solution_description: formData.solution_description,
      used_materials: formData.used_materials
    };
    
    // 根据工单类型调用不同的API
    const apiPromise = this.data.orderInfo.orderType === 'MAINTENANCE' 
      ? maintenanceApi.completeMaintenanceOrder(this.data.orderId, completionData)
      : repairApi.completeWorkOrder(this.data.orderId, completionData);
    
    apiPromise.then(res => {
      wx.hideLoading();
      this.setData({ showHandleForm: false });
      
      if (res && res.code === 200) {
        wx.showToast({
          title: '工单已完成',
          icon: 'success',
          duration: 1500,
          success: () => {
            // 延迟一下再刷新，让用户看到提示
            setTimeout(() => {
              // 刷新当前页面
              this.loadOrderDetail(this.data.orderId, this.data.orderType);
            }, 1500);
          }
        });
      } else {
        wx.showToast({
          title: res?.message || '提交失败',
          icon: 'none'
        });
      }
    })
    .catch(err => {
      wx.hideLoading();
      this.setData({ showHandleForm: false });
      console.error('完成工单失败', err);
      
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      });
    });
  },
  
  viewDeviceDetail: function () {
    wx.navigateTo({
      url: `/pages/device-detail/device-detail?id=${this.data.orderInfo.deviceId}`
    });
  },
  
  onPullDownRefresh: function () {
    this.loadOrderDetail(this.data.orderId, this.data.orderType);
    wx.stopPullDownRefresh();
  },

  // 输入实际耗时
  onActualTimeInput: function(e) {
    const taskId = e.currentTarget.dataset.id;
    const actualTime = parseFloat(e.detail.value);
    
    // 找到对应的任务
    const tasks = this.data.orderInfo.tasks.map(task => {
      if (task.id === taskId) {
        // 检查输入是否有效
        const isValid = !isNaN(actualTime) && actualTime > 0;
        
        return {
          ...task,
          inputActualTime: e.detail.value,
          actual_time: isValid ? actualTime : null,
          confirmed_actual_time: isValid
        };
      }
      return task;
    });
    
    this.setData({
      'orderInfo.tasks': tasks
    });
  },
  

  // 完成保养任务
  completeTask: function(e) {
    const taskId = e.currentTarget.dataset.id;
    const task = this.data.orderInfo.tasks.find(t => t.id === taskId);
    
    // 检查是否有有效的实际耗时
    if (!task || !task.confirmed_actual_time || !task.actual_time) {
      wx.showToast({
        title: '请输入有效的实际耗时',
        icon: 'none'
      });
      return;
    }
    
    const actualTime = task.actual_time;
    
    wx.showModal({
      title: '完成任务',
      content: `确认完成此任务？实际耗时：${actualTime}小时`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '提交中...'
          });
          
          // 使用新的API直接更新任务
          maintenanceApi.updateMaintenanceTask(taskId, {
            task_name: task.task_name,
            task_order: task.task_order,
            standard_time: task.standard_time,
            actual_time: actualTime,
            status: 'completed'
          })
            .then(res => {
              wx.hideLoading();
              
              if (res && res.code === 200) {
                wx.showToast({
                  title: '任务完成',
                  icon: 'success'
                });
                
                // 更新本地任务状态
                const tasks = this.data.orderInfo.tasks.map(task => {
                  if (task.id === taskId) {
                    return {
                      ...task,
                      status: 'completed',
                      completed_at: new Date().toISOString()
                    };
                  }
                  return task;
                });
                
                this.setData({
                  'orderInfo.tasks': tasks
                });
                
                // 检查是否所有任务都已完成或跳过，如果是，提示用户可以完成整个工单
                const allTasksHandled = tasks.every(task => 
                  task.status === 'completed' || task.status === 'skipped'
                );
                
                if (allTasksHandled) {
                  wx.showModal({
                    title: '所有任务已处理',
                    content: '是否立即完成整个工单？',
                    success: (res) => {
                      if (res.confirm) {
                        // 调用完成整个工单的接口
                        this.completeEntireOrder();
                      }
                    }
                  });
                }
              } else {
                wx.showToast({
                  title: res?.message || '操作失败',
                  icon: 'none'
                });
              }
            })
            .catch(err => {
              wx.hideLoading();
              console.error('完成任务失败', err);
              
              wx.showToast({
                title: '操作失败，请重试',
                icon: 'none'
              });
            });
        }
      }
    });
  },
  
  // 添加新方法：直接完成整个工单
  completeEntireOrder: function() {
    // 先弹出处理信息填写表单
    // 如果已有处理信息，则预填充表单
    const orderInfo = this.data.orderInfo;
    this.setData({
      showHandleForm: true,
      handleFormData: {
        handle_description: orderInfo.handleDesc || '',
        solution_description: orderInfo.solutionDesc || '',
        used_materials: orderInfo.usedMaterials || ''
      }
    });
  },
  
  // 跳过保养任务
  skipTask: function(e) {
    const taskId = e.currentTarget.dataset.id;
    const task = this.data.orderInfo.tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    wx.showModal({
      title: '跳过任务',
      content: '确认跳过此任务？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...'
          });
          
          // 使用新的API直接更新任务
          maintenanceApi.updateMaintenanceTask(taskId, {
            task_name: task.task_name,
            task_order: task.task_order,
            standard_time: task.standard_time,
            actual_time: null,
            status: 'skipped'
          })
            .then(res => {
              wx.hideLoading();
              
              if (res && res.code === 200) {
                wx.showToast({
                  title: '已跳过任务',
                  icon: 'success'
                });
                
                // 更新本地任务状态
                const tasks = this.data.orderInfo.tasks.map(t => {
                  if (t.id === taskId) {
                    return {
                      ...t,
                      status: 'skipped',
                      skipped_at: new Date().toISOString()
                    };
                  }
                  return t;
                });
                
                this.setData({
                  'orderInfo.tasks': tasks
                });
                
                // 检查是否所有任务都已完成或跳过，如果是，提示用户可以完成整个工单
                const allTasksHandled = tasks.every(task => 
                  task.status === 'completed' || task.status === 'skipped'
                );
                
                if (allTasksHandled) {
                  wx.showModal({
                    title: '所有任务已处理',
                    content: '是否立即完成整个工单？',
                    success: (res) => {
                      if (res.confirm) {
                        // 调用完成整个工单的接口
                        this.completeEntireOrder();
                      }
                    }
                  });
                }
              } else {
                wx.showToast({
                  title: res?.message || '操作失败',
                  icon: 'none'
                });
              }
            })
            .catch(err => {
              wx.hideLoading();
              console.error('跳过任务失败', err);
              
              wx.showToast({
                title: '操作失败，请重试',
                icon: 'none'
              });
            });
        }
      }
    });
  },
  
  // 添加开始处理维修工单方法
  startWorkOrder: function() {
    wx.showModal({
      title: '开始处理',
      content: '确定要开始处理此工单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...'
          });
          
          const currentTime = formatDate(new Date());
          
          // 根据工单类型调用不同的API
          const apiPromise = this.data.orderInfo.orderType === 'MAINTENANCE' 
            ? maintenanceApi.startMaintenanceOrder(this.data.orderId,currentTime)
            : repairApi.startWorkOrder(this.data.orderId, currentTime);
          
          apiPromise.then(res => {
              wx.hideLoading();
              
              if (res && res.code === 200) {
                wx.showToast({
                  title: '已开始处理',
                  icon: 'success',
                  duration: 1500,
                  success: () => {
                    // 延迟一下再刷新，让用户看到提示
                    setTimeout(() => {
                      // 刷新当前页面
                      this.loadOrderDetail(this.data.orderId, this.data.orderType);
                    }, 1500);
                  }
                });
              } else {
                wx.showToast({
                  title: res?.message || '开始处理失败',
                  icon: 'none'
                });
              }
            })
            .catch(err => {
              wx.hideLoading();
              console.error('开始处理失败', err);
              
              wx.showToast({
                title: '开始处理失败，请重试',
                icon: 'none'
              });
            });
        }
      }
    });
  },

  // 显示验收弹窗
  showAcceptanceModal: function() {
    // 重置验收表单数据
    this.setData({
      showAcceptanceModal: true,
      acceptanceFormData: {
        is_passed: true,
        score: null,
        acceptance_description: ''
      },
      selectedScoreIndex: -1,
      selectedScoreLabel: ''
    })
  },

  // 隐藏验收弹窗
  hideAcceptanceModal: function() {
    this.setData({
      showAcceptanceModal: false
    })
  },

  // 验收结果变化
  onAcceptanceResultChange: function(e) {
    const isPassed = e.detail.value === 'true'
    this.setData({
      'acceptanceFormData.is_passed': isPassed,
      'acceptanceFormData.score': isPassed ? this.data.acceptanceFormData.score : null,
      selectedScoreIndex: isPassed ? this.data.selectedScoreIndex : -1,
      selectedScoreLabel: isPassed ? this.data.selectedScoreLabel : ''
    })
  },

  // 评分选择
  onScoreChange: function(e) {
    const index = e.detail.value
    const selectedOption = this.data.scoreOptions[index]
    
    this.setData({
      'acceptanceFormData.score': selectedOption.value,
      selectedScoreIndex: index,
      selectedScoreLabel: selectedOption.label
    })
  },

  // 验收说明输入
  onAcceptanceDescriptionInput: function(e) {
    this.setData({
      'acceptanceFormData.acceptance_description': e.detail.value
    })
  },

  // 提交验收
  submitAcceptance: function() {
    const { acceptanceFormData } = this.data
    
    // 验证表单
    if (typeof acceptanceFormData.is_passed !== 'boolean') {
      wx.showToast({
        title: '请选择验收结果',
        icon: 'none'
      })
      return
    }

    if (acceptanceFormData.is_passed && !acceptanceFormData.score) {
      wx.showToast({
        title: '通过验收时必须选择评分',
        icon: 'none'
      })
      return
    }

    if (!acceptanceFormData.acceptance_description.trim()) {
      wx.showToast({
        title: '请输入验收说明',
        icon: 'none'
      })
      return
    }

    // 显示确认对话框
    wx.showModal({
      title: '确认验收',
      content: `确定要${acceptanceFormData.is_passed ? '通过' : '不通过'}这个工单的验收吗？`,
      success: (res) => {
        if (res.confirm) {
          this.doSubmitAcceptance()
        }
      }
    })
  },

  // 执行验收提交
  doSubmitAcceptance: function() {
    console.log('开始提交验收，数据:', this.data.acceptanceFormData)
    this.setData({
      submittingAcceptance: true
    })

    deviceWorkOrderApi.acceptance(this.data.orderId, this.data.acceptanceFormData)
      .then(res => {
        this.setData({
          submittingAcceptance: false
        })
        console.log('验收提交响应:', res)

        if (res && res.code === 200) {
          wx.showToast({
            title: '验收成功',
            icon: 'success'
          })
          
          // 隐藏弹窗
          this.hideAcceptanceModal()
          
          // 刷新工单信息
          this.loadOrderDetail(this.data.orderId, this.data.orderType)
        } else {
          console.error('验收提交失败:', res)
          wx.showToast({
            title: res?.message || '验收失败',
            icon: 'error'
          })
        }
      })
      .catch(error => {
        this.setData({
          submittingAcceptance: false
        })
        console.error('验收失败:', error)
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'error'
        })
      })
  },

  // 加载验收信息
  loadAcceptanceInfo: function(orderId) {
    deviceWorkOrderApi.getAcceptance(orderId)
      .then(res => {
        if (res && res.code === 200 && res.data) {
          // 更新工单信息中的验收数据
          this.setData({
            'orderInfo.acceptance': res.data
          })
        }
      })
      .catch(error => {
        console.error('加载验收信息失败:', error)
      })
  },

  // 在页面显示时刷新工单信息（如果需要）
  onShow: function() {
    // 如果需要刷新工单信息，可以在这里添加逻辑
    // 目前工单详情API已经包含了验收信息，无需单独加载
  }
}) 
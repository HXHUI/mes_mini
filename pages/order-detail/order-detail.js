// 引入API模块
import { repairApi } from '../../utils/api/repair.js';
import { maintenanceApi } from '../../utils/api/maintenance.js';
import { formatDate } from '../../utils/util.js';

Page({
  data: {
    orderId: '',
    orderInfo: null,
    isLoading: true,
    orderType: 'REPAIR' // 默认为维修工单
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
          
          // 格式化工单状态文本
          const statusMap = {
            'pending': '待处理',
            'in_progress': '处理中',
            'completed': '已完成',
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
            hasStarted: !!orderData.actual_start // 根据实际开始时间判断是否已开始
          };
          
          // 获取工单图片
          if (orderData.images && orderData.images.length > 0) {
            formattedOrder.faultImages = orderData.images.map(img => img.url || img.file_path || img);
      this.setData({
              orderInfo: formattedOrder,
              isLoading: false
            });
          } else {
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
            'pending': '待处理',
            'in_progress': '处理中',
            'completed': '已完成',
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
            hasStarted: !!orderData.actual_start // 根据实际开始时间判断是否已开始
          };
          
          // 如果API返回中包含任务列表信息，直接使用
          if (orderData.tasks && orderData.tasks.length > 0) {
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
          const images = res.data.map(img => img.url || img.file_path || img);
          
          this.setData({
            'orderInfo.faultImages': images
          });
        }
        
        this.setData({
          orderInfo: orderData,
          isLoading: false
        });
      })
      .catch(err => {
        console.error('获取工单图片失败', err);
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

  previewImage: function (e) {
    const url = e.currentTarget.dataset.url;
    if (this.data.orderInfo.faultImages && this.data.orderInfo.faultImages.length > 0) {
    wx.previewImage({
      current: url,
      urls: this.data.orderInfo.faultImages
    });
    }
  },

  handleOrder: function () {
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
      content: `确定要接手工单 ${this.data.orderInfo.id} 吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...'
          });
          
          // 根据工单类型调用不同的接单API
          if (this.data.orderType === 'MAINTENANCE') {
            // 保养工单接单
            maintenanceApi.acceptMaintenanceOrder(this.data.orderId, userInfo.id)
              .then(res => {
                wx.hideLoading();
                
                if (res && res.code === 200) {
                  wx.showToast({
                    title: '接单成功',
                    icon: 'success'
                  });
                  
                  // 重新加载工单详情
                  this.loadOrderDetail(this.data.orderId, this.data.orderType);
                } else {
                  const errMsg = res?.message || '接单失败';
                  wx.showToast({
                    title: errMsg,
                    icon: 'none'
                  });
                }
              })
              .catch(err => {
                wx.hideLoading();
                console.error('接单失败', err);
                
                wx.showToast({
                  title: '接单失败，请检查网络连接',
                  icon: 'none'
                });
              });
          } else {
            // 维修工单接单
            repairApi.acceptWorkOrder(this.data.orderId, userInfo.id)
              .then(res => {
                wx.hideLoading();
                
                if (res && res.code === 200) {
          wx.showToast({
            title: '接单成功',
            icon: 'success'
          });
                  
                  // 重新加载工单详情
                  this.loadOrderDetail(this.data.orderId, this.data.orderType);
                } else {
                  const errMsg = res?.message || '接单失败';
                  wx.showToast({
                    title: errMsg,
                    icon: 'none'
                  });
                }
              })
              .catch(err => {
                wx.hideLoading();
                console.error('接单失败', err);
                
                wx.showToast({
                  title: '接单失败，请检查网络连接',
                  icon: 'none'
                });
              });
          }
        }
      }
    });
  },
  
  showHandleForm: function () {
    wx.navigateTo({
      url: `/pages/handle-form/handle-form?id=${this.data.orderId}`
    });
  },
  
  completeOrder: function () {
    // 针对不同类型的工单采用不同的完成方式
    if (this.data.orderType === 'MAINTENANCE') {
      // 保养工单走原有流程
      wx.showModal({
        title: '完成工单',
        content: `确定要完成工单 ${this.data.orderInfo.id} 吗？`,
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: `/pages/complete-form/complete-form?id=${this.data.orderId}`
            });
          }
        }
      });
    } else {
      // 维修工单直接完成
      wx.showModal({
        title: '处理完成',
        content: `确定已完成维修工单处理吗？`,
        success: (res) => {
          if (res.confirm) {
            wx.showLoading({
              title: '正在完成...'
            });
            
            // 准备提交数据
            const completionData = {
              actual_end: formatDate(new Date())
            };
            
            // 调用完成工单API
            repairApi.completeWorkOrder(this.data.orderId, completionData)
              .then(res => {
                wx.hideLoading();
                
                if (res && res.code === 200) {
                  wx.showToast({
                    title: '工单已完成',
                    icon: 'success',
                    duration: 1500
                  });
                  
                  // 更新本地状态
                  this.setData({
                    'orderInfo.status': 'completed',
                    'orderInfo.statusText': '已完成',
                    'orderInfo.actualEnd': formatDate(new Date())
                  });
                } else {
                  wx.showToast({
                    title: res?.message || '完成工单失败',
                    icon: 'none'
                  });
                }
              })
              .catch(err => {
                wx.hideLoading();
                console.error('完成工单失败', err);
                
                wx.showToast({
                  title: '完成工单失败，请重试',
                  icon: 'none'
                });
              });
          }
        }
      });
    }
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
  
  // 开始任务方法保留但简化，因为UI中已移除开始按钮
  startTask: function(e) {
    const taskId = e.currentTarget.dataset.id;
    
    // 直接更新本地状态为进行中
    const tasks = this.data.orderInfo.tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: 'in_progress',
          started_at: new Date().toISOString()
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
    wx.showLoading({
      title: '正在完成工单...'
    });
    
    // 准备提交数据
    const completionData = {
      actual_end: formatDate(new Date()), // 使用formatDate函数格式化当前时间
      status: 'completed' // 确保状态被设置为已完成
    };
    
    // 调用完成工单API
    maintenanceApi.completeMaintenanceOrder(this.data.orderId, completionData)
      .then(res => {
        wx.hideLoading();
        
        if (res && res.code === 200) {
          wx.showToast({
            title: '工单已完成',
            icon: 'success',
            duration: 1500
          });
          
          // 延迟后跳转到保养工单列表页
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/maintenance-orders/maintenance-orders'
            });
          }, 1500);
        } else {
          wx.showToast({
            title: res?.message || '完成工单失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('完成工单失败', err);
        
        wx.showToast({
          title: '完成工单失败，请重试',
          icon: 'none'
        });
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
  
  // 添加开始工单方法
  startOrder: function() {
    wx.showModal({
      title: '开始任务',
      content: '确定要开始执行保养任务吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...'
          });
          
          // 调用API开始工单
          maintenanceApi.startMaintenanceOrder(this.data.orderId)
            .then(res => {
              wx.hideLoading();
              
              if (res && res.code === 200) {
                // 更新本地状态
                this.setData({
                  'orderInfo.hasStarted': true,
                  'orderInfo.actualStart': formatDate(new Date())
                });
                
                wx.showToast({
                  title: '任务已开始',
                  icon: 'success'
                });
              } else {
                wx.showToast({
                  title: res?.message || '开始任务失败',
                  icon: 'none'
                });
              }
            })
            .catch(err => {
              wx.hideLoading();
              console.error('开始任务失败', err);
              
              wx.showToast({
                title: '开始任务失败，请重试',
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
      content: '确定要开始处理此维修工单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...'
          });
          
          // 调用API开始工单
          repairApi.startWorkOrder(this.data.orderId,formatDate(new Date()))
            .then(res => {
              wx.hideLoading();
              
              if (res && res.code === 200) {
                // 更新本地状态
                this.setData({
                  'orderInfo.hasStarted': true,
                  'orderInfo.actualStart': formatDate(new Date())
                });
                
                wx.showToast({
                  title: '已开始处理',
                  icon: 'success'
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
}) 
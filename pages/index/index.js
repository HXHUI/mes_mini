// 引入API模块
import { userApi } from '../../utils/api/user.js';
import { deviceWorkOrderApi } from '../../utils/api/device-work-order.js';
import { deviceApi } from '../../utils/api/device.js';
import { wxConfig } from '../../utils/api/index';

Page({
  data: {
    userInfo: {
      name: '加载中...',
      avatar: '/images/icons/avatar-default.png',
    },
    functionCards: [
      {
        id: 'fault-report',
        icon: '/images/icons/fault-report.png',
        title: '故障申报',
        desc: '随时在线申报',
        bgColor: '#2196F3',
        path: '/pages/fault-report/fault-report'
      },
      {
        id: 'fault-handle',
        icon: '/images/icons/icon-maintenance.png',
        title: '保养工单',
        desc: '设备保养',
        bgColor: '#9C27B0',
        path: '/pages/maintenance-orders/maintenance-orders'
      },
      {
        id: 'repair-orders',
        icon: '/images/icons/repair-orders.png',
        title: '维修工单',
        desc: '查看全部工单',
        bgColor: '#4CAF50',
        path: '/pages/repair-orders/repair-orders'
      },
      {
        id: 'scan-device',
        icon: '/images/icons/scan-code.png',
        title: '扫码查看',
        desc: '设备详情',
        bgColor: '#FF9800',
        path: 'scan'
      }
    ],
    noticeList: [
      {
        id: 1,
        title: '7月设备保养计划已发布',
        date: '2023-07-01'
      },
      {
        id: 2,
        title: '新版设备管理系统上线通知',
        date: '2023-06-25'
      }
    ],
    statistics: {
      repair: {
        todoCount: 0,
        processingCount: 0,
        completedCount: 0,
        canceledCount: 0
      },
      maintenance: {
      todoCount: 0,
      processingCount: 0,
      completedCount: 0,
      canceledCount: 0
      }
    }
  },

  onLoad: function() {
    // 检查登录状态
    this.checkLoginStatus()
    // 获取用户信息
    this.getUserInfo()
    
    // 延迟请求订阅消息权限，确保页面已完全加载
    setTimeout(() => {
      this.requestSubscriptionPermission()
    }, 1500)
  },

  onShow: function() {
    // 每次显示页面时重新获取用户信息，确保显示最新数据
    this.getUserInfo()
    
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
    
    // 检查订阅消息权限状态
    this.checkSubscriptionStatus();
  },

  checkLoginStatus: function() {
    const token = wx.getStorageSync('token')
    if (!token) {
      // 设置一个标志，避免无限重定向
      const hasRedirected = wx.getStorageSync('hasRedirected')
      if (!hasRedirected) {
        wx.setStorageSync('hasRedirected', true)
        wx.redirectTo({
          url: '/pages/login/login'
        })
      }
    } else {
      wx.removeStorageSync('hasRedirected')
    }
  },

  getUserInfo: function() {
    // 先尝试从缓存获取用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo
      })
    }

    // 无论是否有缓存，都从API获取最新用户信息
    userApi.getUserInfo()
      .then(res => {
        if (res && res.code === 200 && res.data) {
          const apiUserInfo = res.data;
          
          // 确保userInfo对象中有id字段，打印用户信息
          console.log('获取到的用户信息:', apiUserInfo);
          
          // 格式化用户信息，确保包含real_name字段
          const formattedUserInfo = {
            ...apiUserInfo,
            real_name: apiUserInfo.real_name || apiUserInfo.username || '用户',
            name: apiUserInfo.real_name || apiUserInfo.username || '用户'
          };
          
          // 更新页面和本地存储
          this.setData({
            userInfo: formattedUserInfo
          });
          
          // 更新本地存储的用户信息
          wx.setStorageSync('userInfo', formattedUserInfo);
          
          // 获取用户信息后再加载统计数据
          this.loadStatistics();
        }
      })
      .catch(err => {
        console.error('获取用户信息失败', err);
        // 发生错误时不做特殊处理，使用已有的数据
      });
  },

  loadStatistics: function() {
    // 获取用户ID
    const userInfo = wx.getStorageSync('userInfo') || {}
    const userId = userInfo.id || userInfo.userId || userInfo.user_id || ''
    console.log('加载统计数据使用的用户ID:', userId)
    
    // 使用API获取工单统计数据
    deviceWorkOrderApi.getTodayStatistics()
      .then(res => {
        console.log('获取到的统计数据:', res);
        if (res && res.code === 200 && res.data) {
          const data = res.data;
          
          // 区分维修和保养工单的统计数据
          const repairStats = data.today.repair || {
            pending: 0,
            in_progress: 0,
            completed: 0,
            canceled: 0
          };
          
          const maintenanceStats = data.today.maintenance || {
            pending: 0,
            in_progress: 0,
            completed: 0,
            canceled: 0
          };
          
          // 设置统计数据
          this.setData({
            statistics: {
              repair: {
                todoCount: repairStats.pending || 0,
                processingCount: repairStats.in_progress || 0,
                completedCount: repairStats.completed || 0,
                canceledCount: repairStats.canceled || 0
              },
              maintenance: {
                todoCount: maintenanceStats.pending || 0,
                processingCount: maintenanceStats.in_progress || 0,
                completedCount: maintenanceStats.completed || 0,
                canceledCount: maintenanceStats.canceled || 0
              }
            }
          });
          
          // 保存所有工单的统计数据，以备将来使用
          wx.setStorageSync('workOrderStats', {
            today: data.today,
            all: data.all
          });
        } else {
          console.error('获取统计数据失败:', res);
        }
      })
      .catch(err => {
        console.error('请求统计数据失败:', err);
      });
  },

  navigateTo: function(e) {
    const path = e.currentTarget.dataset.path
    
    // 故障申报需要先扫码获取设备信息
    if (path === '/pages/fault-report/fault-report') {
      this.showScanOptions()
    } else if (path === 'scan') {
      // 扫码查看设备详情
      this.scanForDeviceDetail()
    } else {
      wx.navigateTo({
        url: path
      })
    }
  },

  // 显示扫码方式选择
  showScanOptions: function() {
    wx.showActionSheet({
      itemList: ['扫描二维码', '从相册选择二维码', '从设备列表选择'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 扫描二维码
          this.scanForFaultReport()
        } else if (res.tapIndex === 1) {
          // 从相册选择
          this.chooseQRCodeFromAlbum()
        } else if (res.tapIndex === 2) {
          // 从设备列表选择
          this.navigateToDeviceList()
        }
      }
    })
  },

  // 导航到设备列表页面
  navigateToDeviceList: function() {
    wx.navigateTo({
      url: '/pages/device-list/device-list?mode=select'
    })
  },

  // 扫描二维码进行故障申报
  scanForFaultReport: function() {
    // 检查相机权限
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.camera']) {
          this.doScanForFaultReport()
        } else {
          wx.authorize({
            scope: 'scope.camera',
            success: () => {
              this.doScanForFaultReport()
            },
            fail: () => {
              wx.showModal({
                title: '提示',
                content: '需要相机权限才能扫码',
                confirmText: '去设置',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting()
                  }
                }
              })
            }
          })
        }
      }
    })
  },

  // 执行扫码
  doScanForFaultReport: function() {
    wx.scanCode({
      success: (res) => {
        const deviceId = res.result
        console.log('扫码成功，获取设备ID：', deviceId)
        
        // 导航到故障申报页面并传递设备ID
        wx.navigateTo({
          url: `/pages/fault-report/fault-report?deviceId=${deviceId}`
        })
      },
      fail: (err) => {
        console.error('扫码失败', err)
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        })
      }
    })
  },

  // 从相册选择二维码图片
  chooseQRCodeFromAlbum: function() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        console.log('选择图片成功：', tempFilePath)
        
        // 解析图片中的二维码
        wx.showLoading({
          title: '识别中...'
        })
        
        // 使用微信提供的识别接口
        wx.scanCode({
          scanType: ['qrCode'],
          imageUrl: tempFilePath,
          success: (res) => {
            wx.hideLoading()
            const deviceId = res.result
            console.log('识别成功，获取设备ID：', deviceId)
            
            // 导航到故障申报页面并传递设备ID
            wx.navigateTo({
              url: `/pages/fault-report/fault-report?deviceId=${deviceId}`
            })
          },
          fail: (err) => {
            wx.hideLoading()
            console.error('识别失败', err)
            wx.showToast({
              title: '未能识别二维码',
              icon: 'none'
            })
          }
        })
      },
      fail: (err) => {
        console.error('选择图片失败', err)
      }
    })
  },
  
  // 查看维修工单
  viewRepairOrders: function() {
    console.log('查看维修工单');
    // 获取用户ID
    const userInfo = wx.getStorageSync('userInfo') || {};
    const userId = userInfo.id || userInfo.userId || userInfo.user_id || '';
    
    wx.navigateTo({
      url: `/pages/repair-orders/repair-orders?assigned_to=${userId}&filter_type=assigned_to_me`
    });
  },
  
  // 查看保养工单
  viewMaintenanceOrders: function() {
    console.log('查看保养工单');
    // 获取用户ID
    const userInfo = wx.getStorageSync('userInfo') || {};
    const userId = userInfo.id || userInfo.userId || userInfo.user_id || '';
    
    wx.navigateTo({
      url: `/pages/maintenance-orders/maintenance-orders?assigned_to=${userId}&filter_type=assigned_to_me`
    });
  },
  
  // 旧的工单查看函数，保留以备兼容
  viewWorkOrders: function(e) {
    const type = e.currentTarget.dataset.type;
    console.log('查看工单类型：', type);
    
    // 根据不同类型导航到工单列表页
    let status = '';
    let title = '';
    
    // 使用与API一致的状态值
    if (type === 'pending') {
      status = 'pending';
      title = '待处理工单';
    } else if (type === 'in_progress') {
      status = 'in_progress';
      title = '处理中工单';
    } else if (type === 'completed') {
      status = 'completed';
      title = '已完成工单';
    } else if (type === 'canceled') {
      status = 'canceled';
      title = '已取消工单';
    }
    
    wx.navigateTo({
      url: `/pages/repair-orders/repair-orders?status=${status}&title=${encodeURIComponent(title)}`
    });
  },

  // 扫码查看设备详情
  scanForDeviceDetail: function() {
    // 检查相机权限
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.camera']) {
          this.doScanForDeviceDetail()
        } else {
          wx.authorize({
            scope: 'scope.camera',
            success: () => {
              this.doScanForDeviceDetail()
            },
            fail: () => {
              wx.showModal({
                title: '提示',
                content: '需要相机权限才能扫码',
                confirmText: '去设置',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting()
                  }
                }
              })
            }
          })
        }
      }
    })
  },

  // 执行扫码查看设备详情
  doScanForDeviceDetail: function() {
    wx.scanCode({
      success: (res) => {
        const qrContent = res.result
        console.log('扫码成功，内容：', qrContent)
        
        // 尝试从二维码内容中提取设备ID
        let deviceId = qrContent
        
        // 如果二维码内容是JSON格式，尝试解析
        if (qrContent.startsWith('{') && qrContent.endsWith('}')) {
          try {
            const qrData = JSON.parse(qrContent)
            deviceId = qrData.deviceId || qrData.device_id || qrData.id || qrContent
          } catch (e) {
            console.error('解析二维码内容失败:', e)
          }
        }
        
        // 查询设备信息
        wx.showLoading({
          title: '查询设备中...'
        })
        
        deviceApi.getDeviceDetail(deviceId)
          .then(res => {
            wx.hideLoading()
            
            if (res && res.code === 200 && res.data) {
              // 导航到设备详情页面
              wx.navigateTo({
                url: `/pages/device-detail/device-detail?id=${res.data.device_id}`
              })
            } else {
              wx.showToast({
                title: '未找到设备信息',
                icon: 'none'
              })
            }
          })
          .catch(err => {
            wx.hideLoading()
            console.error('查询设备信息失败:', err)
            wx.showToast({
              title: '查询设备失败',
              icon: 'none'
            })
          })
      },
      fail: (err) => {
        console.error('扫码失败', err)
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        })
      }
    })
  },

  // 请求订阅消息权限
  requestSubscriptionPermission: function() {
    // 获取模板ID
    const templateId = wxConfig.templateIds.repairOrderNotice;
    
    // 检查是否应该请求订阅
    const shouldRequest = wxConfig.shouldRequestSubscription();
    
    // 处理Promise或布尔值结果
    Promise.resolve(shouldRequest).then(should => {
      if (!should) {
        console.log('用户已订阅或最近拒绝过，不再请求订阅');
        return;
      }
      
      console.log('准备请求订阅消息权限，模板ID:', templateId);
      
      // 先显示提示，引导用户订阅
      wx.showModal({
        title: '订阅消息通知',
        content: '为了及时接收设备维修工单的通知，建议您开启订阅消息。是否立即开启？',
        confirmText: '立即订阅',
        cancelText: '暂不需要',
        success: (res) => {
          if (res.confirm) {
            // 用户点击了确认，请求订阅消息权限
            this.doRequestSubscription(templateId);
          } else {
            console.log('用户取消了订阅消息');
            // 记录用户选择，避免频繁弹窗
            wx.setStorageSync('subscription_declined', new Date().getTime());
          }
        }
      });
    });
  },
  
  // 执行订阅消息请求
  doRequestSubscription: function(templateId) {
    // 请求订阅消息权限
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res) => {
        console.log('订阅消息权限请求结果:', res);
        if (res[templateId] === 'accept') {
          console.log('用户接受了订阅消息');
          wx.setStorageSync('subscribed_repair_notice', true);
          
          // 显示订阅成功提示
          wx.showToast({
            title: '订阅成功！将及时收到工单通知',
            icon: 'none',
            duration: 2000
          });
        } else if (res[templateId] === 'reject') {
          console.log('用户拒绝了订阅消息');
          wx.setStorageSync('subscribed_repair_notice', false);
        } else {
          console.log('订阅消息请求结果未知:', res[templateId]);
        }
      },
      fail: (err) => {
        console.error('请求订阅消息权限失败:', err);
      },
      complete: () => {
        // 开发环境下，显示请求结果
        if (wxConfig.isDev) {
          setTimeout(() => {
            const subscribed = wx.getStorageSync('subscribed_repair_notice');
            wx.showToast({
              title: subscribed ? '已订阅通知' : '未订阅通知',
              icon: 'none',
              duration: 2000
            });
          }, 500);
        }
      }
    });
  },

  // 检查订阅消息权限状态
  checkSubscriptionStatus: function() {
    // 获取模板ID
    const templateId = wxConfig.templateIds.repairOrderNotice;
    
    wx.getSetting({
      withSubscriptions: true,
      success: (res) => {
        console.log('检查订阅消息权限状态:', res);
        
        // 检查是否有订阅消息的权限信息
        if (res.subscriptionsSetting && 
            res.subscriptionsSetting.mainSwitch &&
            res.subscriptionsSetting.itemSettings &&
            res.subscriptionsSetting.itemSettings[templateId] === 'accept') {
          console.log('用户在设置中已接受订阅');
          // 更新本地存储的订阅状态
          wx.setStorageSync('subscribed_repair_notice', true);
          // 清除拒绝记录
          wx.removeStorageSync('subscription_declined');
        } else if (res.subscriptionsSetting && 
                  res.subscriptionsSetting.mainSwitch === false) {
          // 用户关闭了订阅消息总开关
          console.log('用户关闭了订阅消息总开关');
          wx.setStorageSync('subscribed_repair_notice', false);
        }
      },
      fail: (err) => {
        console.error('获取订阅消息设置失败:', err);
      }
    });
  },
}) 
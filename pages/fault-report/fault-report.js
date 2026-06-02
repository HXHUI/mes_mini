// 引入API模块
import { deviceApi } from '../../utils/api/device.js';
import { repairApi } from '../../utils/api/repair.js';
import { wxConfig } from '../../utils/api/index';

Page({
  data: {
    deviceId: '',
    deviceInfo: {},
    faultTypes: [
      { value: 'mechanical', text: '机械故障' },
      { value: 'electrical', text: '电气故障' },
      { value: 'software', text: '软件故障' },
      { value: 'other', text: '其他故障' }
    ],
    urgencyLevels: [
      { value: 'low', text: '低' },
      { value: 'medium', text: '中' },
      { value: 'high', text: '高' },
      { value: 'urgent', text: '紧急' }
    ],
    faultTypeIndex: -1,
    urgency: 'medium',
    faultDesc: '',
    faultImages: [],
    isSubmitting: false,
    isFromMaintenance: false,
    isLoading: false // 加载状态
  },

  onLoad: function (options) {
    // 获取设备ID
    if (options.deviceId) {
      this.setData({
        deviceId: options.deviceId,
        isLoading: true // 开始加载
      });
      
      // 通过API获取设备信息
      this.fetchDeviceInfo(options.deviceId);
    }
    
    // 判断是否是维护流程
    if (options.type === 'maintenance') {
      this.setData({
        isFromMaintenance: true
      });
      wx.setNavigationBarTitle({
        title: '设备维护'
      });
    }
  },
  
  // 使用API获取设备信息
  fetchDeviceInfo: function(deviceId) {
    // 显示加载状态
    wx.showLoading({
      title: '获取设备信息...',
    });
    
    deviceApi.getDeviceDetail(deviceId)
      .then(res => {
        wx.hideLoading();
        
        if (res && res.data) {
          const deviceInfo = res.data;
          
          this.setData({
            deviceInfo: deviceInfo,
            isLoading: false
          });
        } else {
          this.handleDeviceInfoError('获取设备信息失败');
        }
      })
      .catch(err => {
        console.error('获取设备信息失败：', err);
        this.handleDeviceInfoError('获取设备信息失败：' + (err.message || '未知错误'));
      });
  },
  
  // 处理设备信息获取失败的情况
  handleDeviceInfoError: function(errorMsg) {
    wx.hideLoading();
    
    wx.showToast({
      title: errorMsg,
      icon: 'none',
      duration: 2000
    });
    
    // 使用默认信息
    this.setData({
      deviceInfo: {
        id: this.data.deviceId,
        name: '未知设备'
      },
      isLoading: false
    });
  },

  onFaultTypeChange: function (e) {
    this.setData({
      faultTypeIndex: parseInt(e.detail.value)
    });
  },

  onUrgencyChange: function (e) {
    this.setData({
      urgency: e.detail.value
    });
  },

  onDescInput: function (e) {
    this.setData({
      faultDesc: e.detail.value
    });
  },

  chooseImage: function () {
    const that = this;
    wx.chooseMedia({
      count: 3 - that.data.faultImages.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: function (res) {
        const tempFiles = res.tempFiles;
        const images = that.data.faultImages.concat(tempFiles.map(file => file.tempFilePath));
        that.setData({
          faultImages: images
        });
      }
    });
  },

  deleteImage: function (e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.faultImages;
    images.splice(index, 1);
    this.setData({
      faultImages: images
    });
  },

  previewImage: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.faultImages
    });
  },

  validateForm: function () {
    if (this.data.faultTypeIndex === -1) {
      wx.showToast({
        title: '请选择故障类型',
        icon: 'none'
      });
      return false;
    }
    
    if (!this.data.faultDesc.trim()) {
      wx.showToast({
        title: '请填写故障描述',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },

  submitReport: function () {
    if (!this.validateForm()) {
      return;
    }
    
    if (this.data.isSubmitting) {
      return;
    }
    
    // 检查是否已订阅通知
    const hasSubscribed = wx.getStorageSync('subscribed_repair_notice');
    if (!hasSubscribed) {
      // 提示用户订阅通知
      this.checkSubscription().then(() => {
        this.doSubmitReport();
      });
    } else {
      // 直接提交
      this.doSubmitReport();
    }
  },
  
  // 检查订阅状态并提示
  checkSubscription: function() {
    return new Promise((resolve) => {
      // 获取模板ID
      const templateId = wxConfig.templateIds.repairOrderNotice;
      
      // 检查用户是否已订阅
      const hasSubscribed = wx.getStorageSync('subscribed_repair_notice');
      if (hasSubscribed) {
        resolve();
        return;
      }
      
      // 检查用户是否在设置中已开启订阅权限
      wx.getSetting({
        withSubscriptions: true,
        success: (res) => {
          console.log('获取订阅消息权限状态:', res);
          // 如果用户已在设置中打开了订阅权限，直接标记为已订阅
          if (res.subscriptionsSetting && 
              res.subscriptionsSetting.mainSwitch &&
              res.subscriptionsSetting.itemSettings &&
              res.subscriptionsSetting.itemSettings[templateId] === 'accept') {
            console.log('用户在设置中已接受订阅');
            wx.setStorageSync('subscribed_repair_notice', true);
            resolve();
            return;
          }
          
          // 否则显示订阅提示
          wx.showModal({
            title: '接收工单通知',
            content: '是否接收此工单的后续处理通知？',
            confirmText: '接收',
            cancelText: '不接收',
            success: (res) => {
              if (res.confirm) {
                // 请求订阅消息权限
                wx.requestSubscribeMessage({
                  tmplIds: [templateId],
                  success: (res) => {
                    if (res[templateId] === 'accept') {
                      wx.setStorageSync('subscribed_repair_notice', true);
                    }
                  },
                  complete: () => {
                    // 无论结果如何，继续提交
                    resolve();
                  }
                });
              } else {
                // 用户不想接收通知，也继续提交
                resolve();
              }
            },
            fail: () => {
              // 对话框显示失败，继续提交
              resolve();
            }
          });
        },
        fail: (err) => {
          console.error('获取订阅消息设置失败:', err);
          resolve();
        }
      });
    });
  },
  
  // 执行提交报告
  doSubmitReport: function() {
    this.setData({
      isSubmitting: true
    });
    
    wx.showLoading({
      title: '提交中...'
    });
    
    // 获取当前用户ID
    const userInfo = wx.getStorageSync('userInfo');
    const userId = userInfo ? userInfo.id : null;
    
    // 准备提交数据
    const reportData = {
      device_id: this.data.deviceId,
      device_name: this.data.deviceInfo.device_name,
      fault_type: this.data.faultTypes[this.data.faultTypeIndex].value,
      urgency: this.data.urgency,
      description: this.data.faultDesc,
      creator_id: userId // 使用用户ID
    };
    
    // 先创建工单，再上传图片
    repairApi.submitFaultReport(reportData)
      .then(res => {
        if (res && (res.code === 200 || res.code === 201)) {
          const orderId = res.data.id;
          
          // 如果有图片需要上传
          if (this.data.faultImages.length > 0) {
            return repairApi.uploadWorkOrderImages(orderId, this.data.faultImages)
              .then(() => {
                return { success: true, orderId: orderId };
              })
              .catch(err => {
                console.error('上传图片失败：', err);
                // 即使图片上传失败，工单仍然创建成功
                return { success: true, orderId: orderId, imageError: true };
              });
          } else {
            return { success: true, orderId: orderId };
          }
        } else {
          throw new Error(res.message || '提交失败');
        }
      })
      .then(result => {
        wx.hideLoading();
        this.setData({
          isSubmitting: false
        });
        
        if (result.success) {
          let message = '提交成功';
          if (result.imageError) {
            message = '工单已创建，但图片上传失败';
          }
          
          wx.showToast({
            title: message,
            icon: result.imageError ? 'none' : 'success',
            duration: 2000
          });
          
          // 延迟返回首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }, 2000);
        }
      })
      .catch(err => {
        console.error('提交报修单失败：', err);
        wx.hideLoading();
        
        this.setData({
          isSubmitting: false
        });
        
        wx.showToast({
          title: '提交失败：' + (err.message || '未知错误'),
          icon: 'none',
          duration: 2000
        });
      });
  },
  
  cancel: function () {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
}) 
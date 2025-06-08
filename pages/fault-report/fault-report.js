// 引入API模块
import { deviceApi } from '../../utils/api/device.js';
import { repairApi } from '../../utils/api/repair.js';

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
    contactName: '',
    contactPhone: '',
    location: '',
    isSubmitting: false,
    isFromMaintenance: false,
    isLoading: false // 添加加载状态
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
    
    // 预填充联系人信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        contactName: userInfo.name || '',
        contactPhone: userInfo.phone || '13713777064'
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
            location: deviceInfo.location || '',
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
        name: '未知设备',
        location: ''
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

  onContactNameInput: function (e) {
    this.setData({
      contactName: e.detail.value
    });
  },

  onContactPhoneInput: function (e) {
    this.setData({
      contactPhone: e.detail.value
    });
  },

  onLocationInput: function (e) {
    this.setData({
      location: e.detail.value
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
    
    if (!this.data.contactName.trim()) {
      wx.showToast({
        title: '请填写联系人',
        icon: 'none'
      });
      return false;
    }
    
    if (!this.data.contactPhone.trim()) {
      wx.showToast({
        title: '请填写联系电话',
        icon: 'none'
      });
      return false;
    }
    
    // 简单的手机号验证
    const phoneReg = /^1\d{10}$/;
    if (!phoneReg.test(this.data.contactPhone)) {
      wx.showToast({
        title: '请输入正确的手机号',
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
    
    this.setData({
      isSubmitting: true
    });
    
    wx.showLoading({
      title: '提交中...'
    });
    
    // 准备提交数据
    const reportData = {
      device_id: this.data.deviceId,
      device_name: this.data.deviceInfo.device_name,
      fault_type: this.data.faultTypes[this.data.faultTypeIndex].value,
      urgency: this.data.urgency,
      description: this.data.faultDesc,
      contact_name: this.data.contactName,
      contact_phone: this.data.contactPhone,
      location: this.data.location
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
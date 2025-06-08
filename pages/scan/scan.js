// pages/scan/scan.js
Page({
  data: {
    isFlashOn: false,
    scanHistory: [],
    deviceType: '', // 用于区分扫码用途：维修、查看等
    isPermissionDenied: false
  },

  onLoad: function (options) {
    // 如果有扫码类型参数
    if (options.type) {
      this.setData({
        deviceType: options.type
      });
    }
    
    // 获取本地存储的扫码历史
    const history = wx.getStorageSync('scanHistory') || [];
    this.setData({
      scanHistory: history.slice(0, 5) // 只显示最近5条
    });
  },
  
  onShow: function () {
    // 检查相机权限
    this.checkCameraPermission();
  },
  
  checkCameraPermission: function () {
    const that = this;
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.camera']) {
          wx.authorize({
            scope: 'scope.camera',
            success() {
              // 用户已经同意相机授权
            },
            fail() {
              that.setData({
                isPermissionDenied: true
              });
              
              wx.showModal({
                title: '需要相机权限',
                content: '请允许使用相机进行设备扫码',
                confirmText: '去设置',
                success(res) {
                  if (res.confirm) {
                    wx.openSetting();
                  } else {
                    wx.navigateBack();
                  }
                }
              });
            }
          });
        }
      }
    });
  },

  error: function (e) {
    console.error('相机错误', e.detail);
    wx.showToast({
      title: '相机启动失败',
      icon: 'none'
    });
  },

  handleScanCode: function (e) {
    const code = e.detail.result;
    if (code) {
      this.processCode(code);
    }
  },
  
  processCode: function (code) {
    // 解析二维码，通常包含设备ID等信息
    // 这里假设二维码内容是设备ID
    const deviceId = code;
    
    // 保存到扫码历史
    this.saveToHistory(deviceId, '设备');
    
    // 根据扫码类型进行不同处理
    if (this.data.deviceType === 'repair') {
      // 进入报修流程
      wx.navigateTo({
        url: `/pages/fault-report/fault-report?deviceId=${deviceId}`
      });
    } else if (this.data.deviceType === 'maintenance') {
      // 进入维护流程
      wx.navigateTo({
        url: `/pages/fault-handle/fault-handle?deviceId=${deviceId}`
      });
    } else {
      // 默认进入设备详情
      wx.navigateTo({
        url: `/pages/device-detail/device-detail?id=${deviceId}`
      });
    }
  },
  
  saveToHistory: function (id, name) {
    // 获取当前历史记录
    let history = wx.getStorageSync('scanHistory') || [];
    
    // 添加新记录到最前面
    const newRecord = {
      id: id,
      name: name + id,
      time: this.formatTime(new Date())
    };
    
    // 检查是否已存在相同ID的记录
    const index = history.findIndex(item => item.id === id);
    if (index >= 0) {
      history.splice(index, 1);
    }
    
    history.unshift(newRecord);
    
    // 只保留最近10条
    if (history.length > 10) {
      history = history.slice(0, 10);
    }
    
    // 保存到本地存储
    wx.setStorageSync('scanHistory', history);
    
    // 更新显示
    this.setData({
      scanHistory: history.slice(0, 5)
    });
  },
  
  formatTime: function (date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    
    return [year, month, day].map(this.formatNumber).join('/') + ' ' + [hour, minute].map(this.formatNumber).join(':');
  },
  
  formatNumber: function (n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
  },

  toggleFlash: function () {
    const isFlashOn = !this.data.isFlashOn;
    this.setData({
      isFlashOn: isFlashOn
    });
    
    // 切换闪光灯状态
    const cameraContext = wx.createCameraContext();
    cameraContext.setFlashMode({
      mode: isFlashOn ? 'on' : 'off'
    });
  },

  inputCode: function () {
    wx.showModal({
      title: '手动输入设备编码',
      placeholderText: '请输入设备编码',
      editable: true,
      success: (res) => {
        if (res.confirm && res.content) {
          this.processCode(res.content);
        }
      }
    });
  },
  
  goToDeviceDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/device-detail/device-detail?id=${id}`
    });
  }
}) 
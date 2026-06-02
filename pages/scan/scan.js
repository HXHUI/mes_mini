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
    
    // 在页面加载时就开始尝试获取相机权限
    console.log('页面加载，开始预检查相机权限');
    this.preCheckCameraPermission();
  },
  
  onShow: function () {
    console.log('扫码页面显示');
    // 检查相机权限
    this.checkCameraPermission();
    
    // 延迟检查权限状态，确保获取最新状态
    setTimeout(() => {
      this.refreshPermissionStatus();
    }, 500);
  },
  
  checkCameraPermission: function () {
    const that = this;
    
    // 先检查是否已经有权限
    wx.getSetting({
      success(res) {
        console.log('权限设置:', res.authSetting);
        
        if (res.authSetting['scope.camera'] === true) {
          // 已经有权限，可以正常使用相机
          console.log('相机权限已获取');
          that.setData({
            isPermissionDenied: false
          });
        } else if (res.authSetting['scope.camera'] === false) {
          // 用户拒绝了权限，引导用户去设置页面
          that.setData({
            isPermissionDenied: true
          });
          
          wx.showModal({
            title: '需要相机权限',
            content: '您已拒绝相机权限，请在设置中开启',
            confirmText: '去设置',
            cancelText: '取消',
            success(res) {
              if (res.confirm) {
                that.goToSettings();
              } else {
                wx.navigateBack();
              }
            }
          });
        } else {
          // 还没有请求过权限，尝试多种方式触发权限请求
          console.log('尝试多种方式触发相机权限请求');
          that.tryMultiplePermissionMethods();
        }
      },
      fail(err) {
        console.error('获取设置失败:', err);
        // 如果获取设置失败，尝试主动请求权限
        that.tryMultiplePermissionMethods();
      }
    });
  },

  // 尝试多种权限获取方法
  tryMultiplePermissionMethods: function () {
    const that = this;
    
    // 方法1：尝试创建相机上下文
    console.log('方法1：尝试创建相机上下文');
    try {
      const cameraContext = wx.createCameraContext();
      if (cameraContext) {
        console.log('相机上下文创建成功');
        // 延迟一下再检查权限状态
        setTimeout(() => {
          that.checkPermissionAfterContext();
        }, 1000);
        return;
      }
    } catch (e) {
      console.log('相机上下文创建失败:', e);
    }
    
    // 方法2：尝试主动请求权限
    console.log('方法2：尝试主动请求权限');
    that.requestCameraPermission();
  },

  // 创建相机上下文后检查权限
  checkPermissionAfterContext: function () {
    wx.getSetting({
      success: (res) => {
        console.log('创建上下文后的权限状态:', res.authSetting);
        if (res.authSetting['scope.camera'] === true) {
          this.setData({
            isPermissionDenied: false
          });
        } else {
          // 仍然没有权限，尝试主动请求
          this.requestCameraPermission();
        }
      }
    });
  },

  // 主动请求相机权限
  requestCameraPermission: function () {
    const that = this;
    console.log('主动请求相机权限');
    
    // 先尝试使用 wx.authorize
    wx.authorize({
      scope: 'scope.camera',
      success() {
        console.log('wx.authorize 成功获取相机权限');
        that.setData({
          isPermissionDenied: false
        });
      },
      fail(err) {
        console.error('wx.authorize 失败:', err);
        
        // 如果 wx.authorize 失败，尝试其他方法
        that.tryAlternativePermissionMethods();
      }
    });
  },

  // 尝试其他权限获取方法
  tryAlternativePermissionMethods: function () {
    const that = this;
    console.log('尝试其他权限获取方法');
    
    // 方法1：尝试使用 wx.getSetting 检查是否有隐藏权限
    wx.getSetting({
      success: (res) => {
        console.log('重新检查权限状态:', res.authSetting);
        
        // 检查是否有其他相关的权限
        const hasAnyPermission = Object.keys(res.authSetting).some(key => 
          key.includes('camera') || key.includes('photo') || key.includes('video')
        );
        
        if (hasAnyPermission) {
          console.log('发现相关权限:', res.authSetting);
        }
        
        // 如果仍然没有相机权限，显示引导
        if (!res.authSetting['scope.camera']) {
          that.setData({
            isPermissionDenied: true
          });
          that.showPermissionGuide();
        }
      },
      fail: (err) => {
        console.error('重新检查权限失败:', err);
        that.setData({
          isPermissionDenied: true
        });
        that.showPermissionGuide();
      }
    });
  },

  // 显示权限引导
  showPermissionGuide: function () {
    wx.showModal({
      title: '需要相机权限',
      content: '为了进行设备扫码，需要获取相机使用权限。\n\n如果设置页面没有相机权限选项，请先使用体验版获取权限，或尝试以下方法：',
      confirmText: '去设置',
      cancelText: '查看解决方案',
      success: (res) => {
        if (res.confirm) {
          this.goToSettings();
        } else {
          // 显示详细的解决方案
          this.showDetailedSolution();
        }
      }
    });
  },

  // 显示详细解决方案
  showDetailedSolution: function () {
    wx.showModal({
      title: '相机权限解决方案',
      content: '1. 先使用体验版小程序，在体验版中获取相机权限\n2. 然后使用正式版，权限会自动继承\n3. 或者重启微信后重新进入小程序\n4. 检查微信版本是否最新',
      confirmText: '去设置',
      cancelText: '手动输入',
      success: (res) => {
        if (res.confirm) {
          this.goToSettings();
        } else {
          this.inputCode();
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

  goToSettings: function () {
    // 先检查当前权限状态
    wx.getSetting({
      success: (res) => {
        console.log('当前权限状态:', res.authSetting);
        
        if (res.authSetting['scope.camera'] === true) {
          // 已经有权限了
          this.setData({
            isPermissionDenied: false
          });
          wx.showToast({
            title: '权限已开启',
            icon: 'success'
          });
          return;
        }
        
        // 打开设置页面
        wx.openSetting({
          success: (settingRes) => {
            console.log('设置页面结果:', settingRes);
            if (settingRes.authSetting['scope.camera']) {
              // 用户在设置页面开启了权限
              this.setData({
                isPermissionDenied: false
              });
              wx.showToast({
                title: '权限已开启',
                icon: 'success'
              });
            } else {
              // 权限仍未开启，提供更多帮助
              this.showPermissionHelp();
            }
          },
          fail: (err) => {
            console.error('打开设置页面失败:', err);
            this.showPermissionHelp();
          }
        });
      },
      fail: (err) => {
        console.error('获取权限状态失败:', err);
        // 直接打开设置页面
        wx.openSetting({
          success: (settingRes) => {
            console.log('设置页面结果:', settingRes);
            if (settingRes.authSetting['scope.camera']) {
              this.setData({
                isPermissionDenied: false
              });
            }
          }
        });
      }
    });
  },

  // 显示权限帮助信息
  showPermissionHelp: function () {
    wx.showModal({
      title: '权限设置帮助',
      content: '如果设置页面没有相机权限选项，请尝试以下方法：\n\n1. 重启微信\n2. 重新进入小程序\n3. 检查微信版本是否最新\n4. 联系技术支持',
      confirmText: '我知道了',
      showCancel: false
    });
  },

  // 预检查相机权限
  preCheckCameraPermission: function () {
    console.log('预检查相机权限');
    
    // 尝试创建相机上下文来"预热"权限系统
    try {
      const cameraContext = wx.createCameraContext();
      if (cameraContext) {
        console.log('预检查：相机上下文创建成功');
        // 延迟检查权限状态
        setTimeout(() => {
          this.checkPermissionAfterPreCheck();
        }, 500);
      }
    } catch (e) {
      console.log('预检查：相机上下文创建失败:', e);
    }
  },

  // 预检查后的权限检查
  checkPermissionAfterPreCheck: function () {
    wx.getSetting({
      success: (res) => {
        console.log('预检查后的权限状态:', res.authSetting);
        if (res.authSetting['scope.camera'] === true) {
          console.log('预检查成功：已获得相机权限');
          this.setData({
            isPermissionDenied: false
          });
        }
      }
    });
  },

  // 刷新权限状态
  refreshPermissionStatus: function () {
    wx.getSetting({
      success: (res) => {
        console.log('刷新权限状态:', res.authSetting);
        if (res.authSetting['scope.camera'] === true) {
          this.setData({
            isPermissionDenied: false
          });
        } else if (res.authSetting['scope.camera'] === false) {
          this.setData({
            isPermissionDenied: true
          });
        }
      }
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
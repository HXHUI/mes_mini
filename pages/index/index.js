Page({
  data: {
    userInfo: {
      name: '张工程师',
      avatar: '/images/icons/avatar-default.png',
    },
    functionCards: [
      {
        id: 'fault-report',
        icon: '/images/icons/report.png',
        title: '故障申报',
        desc: '随在线申报',
        bgColor: '#2196F3',
        path: '/pages/fault-report/fault-report'
      },
      {
        id: 'fault-handle',
        icon: '/images/icons/repair.png',
        title: '故障处理',
        desc: '单处理',
        bgColor: '#9C27B0',
        path: '/pages/fault-handle/fault-handle'
      },
      {
        id: 'scan-repair',
        icon: '/images/icons/scan.png',
        title: '扫码维修',
        desc: '扫码维修',
        bgColor: '#FF7043',
        path: '/pages/scan/scan'
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
      todoCount: 5,
      processingCount: 3,
      completedCount: 12
    }
  },

  onLoad: function() {
    // 检查登录状态
    this.checkLoginStatus()
    // 获取用户信息
    this.getUserInfo()
  },

  onShow: function() {
    // 刷新统计数据
    this.loadStatistics()
    
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
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
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo
      })
    } else {
      // 使用默认值，已在模板中设置
    }
  },

  loadStatistics: function() {
    // 这里应该从API获取数据
    // 目前使用模拟数据
    // 已在模板中设置默认值
  },

  navigateTo: function(e) {
    const path = e.currentTarget.dataset.path
    
    // 故障申报需要先扫码获取设备信息
    if (path === '/pages/fault-report/fault-report') {
      this.showScanOptions()
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

  handleScan: function() {
    // 检查相机权限
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.camera']) {
          this.scanCode()
        } else {
          wx.authorize({
            scope: 'scope.camera',
            success: () => {
              this.scanCode()
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

  scanCode: function() {
    wx.scanCode({
      success: (res) => {
        const deviceId = res.result
        wx.navigateTo({
          url: `/pages/device-detail/device-detail?id=${deviceId}`
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

  viewAllNotices: function() {
    wx.navigateTo({
      url: '/pages/messages/messages'
    })
  },

  viewWorkOrders: function(e) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({
      url: `/pages/repair-orders/repair-orders?status=${type}`
    })
  }
}) 
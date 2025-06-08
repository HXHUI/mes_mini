Page({
  data: {
    userInfo: {
      name: '张工程师',
      avatar: '/images/icons/avatar-default.png',
      department: '设备维修部',
      position: '设备工程师',
      employeeId: 'EMP20230001'
    },
    menus: [
      {
        icon: 'repair',
        text: '我的维修',
        path: '/pages/repair-orders/repair-orders?type=my'
      },
      {
        icon: 'history',
        text: '历史记录',
        path: '/pages/repair-orders/repair-orders?type=history'
      },
      {
        icon: 'star',
        text: '常用设备',
        path: '/pages/favorite-devices/favorite-devices'
      },
      {
        icon: 'setting',
        text: '系统设置',
        path: '/pages/settings/settings'
      }
    ]
  },

  onLoad: function () {
    // 加载用户信息
    this.loadUserInfo()
  },
  
  onShow: function() {
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      })
    }
  },

  loadUserInfo: function () {
    // 这里可以调用API获取用户信息
    // 目前使用模拟数据
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo
      })
    }
  },

  navigateTo: function (e) {
    const path = e.currentTarget.dataset.path
    wx.navigateTo({
      url: path
    })
  },

  handleLogout: function () {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          
          // 跳转到登录页
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      }
    })
  }
}) 
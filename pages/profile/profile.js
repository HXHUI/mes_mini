const { userApi } = require('../../utils/api/user.js');

Page({
  data: {
    userInfo: {
      name: '张工程师',
      avatar: '/images/icons/avatar-default.png',
      department: '设备维修部',
      position: '设备工程师',
      employeeId: 'EMP20230001'
    },
    isWechatBound: false, // 是否已绑定微信账号
    menus: [
      {
        icon: 'repair',
        text: '我的维修工单',
        path: '/pages/repair-orders/repair-orders?type=my'
      },
      {
        icon: 'maintenance',
        text: '我的保养工单',
        path: '/pages/maintenance-orders/maintenance-orders?type=my'
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
    
    // 每次显示页面时重新获取用户信息，确保显示最新数据
    this.loadUserInfo();
  },

  // 检查微信绑定状态
  checkWechatBindStatus: function() {
    // 检查本地存储中是否有openid
    const openid = wx.getStorageSync('openid');
    const userInfo = wx.getStorageSync('userInfo');
    
    // 如果有openid，并且用户信息中有wechat_openid或wechat_bound字段，说明已绑定
    if (openid && userInfo && (userInfo.wechat_openid || userInfo.wechat_bound)) {
      this.setData({
        isWechatBound: true
      });
    } else {
      this.setData({
        isWechatBound: false
      });
    }
  },

  loadUserInfo: function () {
    // 先尝试从缓存获取用户信息
    const cachedUserInfo = wx.getStorageSync('userInfo')
    if (cachedUserInfo) {
      this.setData({
        userInfo: cachedUserInfo
      })
      
      // 检查微信绑定状态
      this.checkWechatBindStatus();
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '加载中',
    })
    
    // 调用API获取最新用户信息
    userApi.getUserInfo()
      .then(res => {
        wx.hideLoading()
        
        if (res && res.code === 200 && res.data) {
          // API返回的用户数据
          const apiData = res.data
          
          // 格式化用户信息，适配页面显示需要
          const apiUserInfo = {
            name: apiData.real_name || apiData.username || '未设置姓名',
            avatar: apiData.avatar || '/images/icons/avatar-default.png',
            department: apiData.department || '未设置部门',
            position: apiData.position || '未设置职位',
            id: apiData.id || '',
            user_id: apiData.id || 'EMP20230001', // 添加user_id字段，用于页面显示
            email: apiData.email || '',
            phone: apiData.phone || '',
            status: apiData.status || '',
            // 微信绑定状态
            wechat_openid: apiData.wechat_openid || '',
            wechat_bound: apiData.wechat_bound || false,
            // 保存原始数据，以便在其他地方使用
            originalData: apiData
          }
          
          // 更新页面数据
          this.setData({
            userInfo: apiUserInfo
          })
          
          // 保存到本地缓存
          wx.setStorageSync('userInfo', apiUserInfo)
          
          // 检查微信绑定状态
          this.checkWechatBindStatus();
          
          console.log('用户信息获取成功:', apiUserInfo)
        } else {
          wx.showToast({
            title: res.message || '获取用户信息失败',
            icon: 'none'
          })
        }
      })
      .catch(err => {
        wx.hideLoading()
        console.error('获取用户信息失败', err)
        
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        })
      })
  },

  navigateTo: function (e) {
    const path = e.currentTarget.dataset.path
    
    // 功能未开放的菜单项显示提示
    if (path === '/pages/settings/settings') {
      wx.showToast({
        title: '该功能即将开放，敬请期待',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 处理我的维修工单跳转
    if (path === '/pages/repair-orders/repair-orders?type=my') {
      wx.navigateTo({
        url: '/pages/repair-orders/repair-orders?type=my'
      })
      return
    }
    
    // 处理我的保养工单跳转
    if (path === '/pages/maintenance-orders/maintenance-orders?type=my') {
      wx.navigateTo({
        url: '/pages/maintenance-orders/maintenance-orders?type=my'
      })
      return
    }
    
    // 正常跳转
    wx.navigateTo({
      url: path
    })
  },

  // 处理微信账号绑定/解绑
  handleWechatAccount: function() {
    if (this.data.isWechatBound) {
      // 已绑定，提示是否解绑
      wx.showModal({
        title: '解绑微信',
        content: '确定要解绑微信账号吗？解绑后将无法使用微信快捷登录。',
        success: (res) => {
          if (res.confirm) {
            this.unbindWechat();
          }
        }
      });
    } else {
      // 未绑定，获取微信code并跳转到绑定页面
      wx.login({
        success: (res) => {
          if (res.code) {
            wx.navigateTo({
              url: `/pages/account-bind/account-bind?code=${res.code}`
            });
          } else {
            wx.showToast({
              title: '获取微信登录凭证失败',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          console.error('微信登录失败', err);
          wx.showToast({
            title: '微信登录失败',
            icon: 'none'
          });
        }
      });
    }
  },
  
  // 解绑微信账号
  unbindWechat: function() {
    wx.showLoading({
      title: '解绑中',
    });
    
    userApi.unbindWechat()
      .then(res => {
        wx.hideLoading();
        
        if (res && res.code === 200) {
          // 解绑成功，清除openid
          wx.removeStorageSync('openid');
          
          // 更新绑定状态
          this.setData({
            isWechatBound: false
          });
          
          // 更新用户信息中的微信绑定状态
          const userInfo = this.data.userInfo;
          userInfo.wechat_bound = false;
          userInfo.wechat_openid = '';
          this.setData({
            userInfo: userInfo
          });
          
          // 更新缓存
          wx.setStorageSync('userInfo', userInfo);
          
          wx.showToast({
            title: '解绑成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: res.message || '解绑失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('解绑失败', err);
        
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        });
      });
  },

  handleLogout: function () {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          wx.removeStorageSync('token')
          wx.removeStorageSync('refreshToken')
          wx.removeStorageSync('userInfo')
          // 注意：不要清除openid，保留它可以实现下次快捷登录
          
          // 跳转到登录页
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      }
    })
  }
}) 
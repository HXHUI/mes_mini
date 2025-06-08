// pages/login/login.js
import { userApi } from '../../utils/api.js';

Page({
  data: {
    employeeId: '',
    password: '',
    isLoading: false
  },

  onLoad: function () {
    // 检查是否有本地缓存的登录信息
    const token = wx.getStorageSync('token');
    if (token) {
      // 如果已经登录，跳转到首页
      this.navigateToIndex();
    }
  },

  onEmployeeIdInput: function (e) {
    this.setData({
      employeeId: e.detail.value
    });
  },

  onPasswordInput: function (e) {
    this.setData({
      password: e.detail.value
    });
  },

  handleLogin: function () {
    const { employeeId, password } = this.data;
    
    // 表单验证
    if (!employeeId) {
      wx.showToast({
        title: '请输入工号',
        icon: 'none'
      });
      return;
    }
    
    if (!password) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      isLoading: true
    });
    
    // 调用登录API
    userApi.login({
      employeeId: employeeId,
      password: password
    }).then(res => {
      // 存储登录信息
      wx.setStorageSync('token', res.data.token);
      wx.setStorageSync('userInfo', res.data.userInfo);
      
      this.setData({
        isLoading: false
      });
      
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          // 跳转到首页
          setTimeout(() => {
            this.navigateToIndex();
          }, 1500);
        }
      });
    }).catch(err => {
      this.setData({
        isLoading: false
      });
      console.error('登录失败', err);
    });
  },
  
  handleWechatLogin: function () {
    wx.showLoading({
      title: '正在登录',
    });
    
    // 调用微信登录API获取code
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('微信登录成功，获取到code: ', res.code);
          
          // 获取用户信息
          this.getUserProfile(res.code);
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '微信登录失败',
            icon: 'none'
          });
          console.error('微信登录失败', res.errMsg);
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '微信登录失败',
          icon: 'none'
        });
        console.error('微信登录失败', err);
      }
    });
  },
  
  getUserProfile: function(code) {
    // 获取用户信息，需要用户授权
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (userRes) => {
        console.log('获取用户信息成功: ', userRes);
        
        // 发送code和用户信息到服务器，换取登录态
        this.sendCodeToServer(code, userRes.userInfo);
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
        console.error('获取用户信息失败', err);
      }
    });
  },
  
  sendCodeToServer: function(code, wxUserInfo) {
    // 调用微信登录API
    userApi.wechatLogin(code, wxUserInfo)
      .then(res => {
        // 存储登录信息
        wx.setStorageSync('token', res.data.token);
        wx.setStorageSync('userInfo', res.data.userInfo);
        
        wx.hideLoading();
        
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500,
          success: () => {
            // 跳转到首页
            setTimeout(() => {
              this.navigateToIndex();
            }, 1500);
          }
        });
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
        console.error('微信登录失败', err);
      });
  },
  
  navigateToIndex: function () {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
}) 
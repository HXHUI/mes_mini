// pages/login/login.js
import { userApi } from '../../utils/api/user.js';

Page({
  data: {
    username: '',
    password: '',
    isLoading: false,
    isWechatLoading: false
  },

  onLoad: function () {
    // 检查是否有本地缓存的登录信息
    const token = wx.getStorageSync('token');
    if (token) {
      // 检查token是否有效
      this.checkToken();
    }
  },

  checkToken: function() {
    wx.showLoading({
      title: '检查登录状态',
    });

    userApi.checkLoginStatus()
      .then(res => {
        wx.hideLoading();
        if (res && res.code === 200) {
          // token有效，跳转到首页
          this.navigateToIndex();
        } else {
          // token无效，清除缓存
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('检查登录状态失败', err);
        // 出错时清除缓存
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
      });
  },

  onUsernameInput: function (e) {
    this.setData({
      username: e.detail.value
    });
  },

  onPasswordInput: function (e) {
    this.setData({
      password: e.detail.value
    });
  },

  handleLogin: function () {
    const { username, password } = this.data;
    
    // 表单验证
    if (!username) {
      wx.showToast({
        title: '请输入用户名',
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
      username: username,
      password: password
    }).then(res => {
      this.setData({
        isLoading: false
      });

      if (res && res.code === 200 && res.data) {
        // 存储登录信息
        wx.setStorageSync('token', res.data.token);
        wx.setStorageSync('userInfo', res.data.user);
        
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
      } else {
        wx.showToast({
          title: res.message || '登录失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      this.setData({
        isLoading: false
      });
      
      wx.showToast({
        title: err.message || '登录失败，请重试',
        icon: 'none'
      });
      
      console.error('登录失败', err);
    });
  },
  
  handleWechatLogin: function () {
    this.setData({
      isWechatLoading: true
    });
    
    // 调用微信登录API获取code
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('微信登录成功，获取到code: ', res.code);
          
          // 获取用户信息
          this.getUserProfile(res.code);
        } else {
          this.setData({
            isWechatLoading: false
          });
          
          wx.showToast({
            title: '微信登录失败',
            icon: 'none'
          });
          
          console.error('微信登录失败', res.errMsg);
        }
      },
      fail: (err) => {
        this.setData({
          isWechatLoading: false
        });
        
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
        this.setData({
          isWechatLoading: false
        });
        
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
        this.setData({
          isWechatLoading: false
        });
        
        if (res && res.code === 200 && res.data) {
          // 存储登录信息
          wx.setStorageSync('token', res.data.token);
          wx.setStorageSync('userInfo', res.data.user);
          
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
        } else {
          wx.showToast({
            title: res.message || '微信登录失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        this.setData({
          isWechatLoading: false
        });
        
        wx.showToast({
          title: err.message || '微信登录失败',
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
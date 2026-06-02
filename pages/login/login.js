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
    } else {
      // 尝试微信静默登录
      this.silentWechatLogin();
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
          // 尝试微信静默登录
          this.silentWechatLogin();
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('检查登录状态失败', err);
        // 出错时清除缓存
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
        // 尝试微信静默登录
        this.silentWechatLogin();
      });
  },

  // 微信静默登录
  silentWechatLogin: function() {
    // 检查是否有openid缓存
    const openid = wx.getStorageSync('openid');
    if (openid) {
      console.log('检测到已有openid，尝试静默登录');
      // 已有openid，尝试使用openid登录
      this.loginWithOpenid(openid);
    } else {
      // 没有openid，获取微信code
      this.getWxCode(true);
    }
  },
  
  // 使用openid登录
  loginWithOpenid: function(openid) {
    userApi.wechatSilentLogin(openid)
      .then(res => {
        if (res && res.code === 200 && res.data) {
          // 登录成功
          wx.setStorageSync('token', res.data.token);
          wx.setStorageSync('userInfo', res.data.user);
          if (res.data.refreshToken) {
            wx.setStorageSync('refreshToken', res.data.refreshToken);
          }
          this.navigateToIndex();
        } else if (res && res.code === 201) {
          // 用户存在但未绑定，显示绑定界面
          console.log('微信用户未绑定系统账号');
        }
      })
      .catch(err => {
        console.error('静默登录失败', err);
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
        // 存储刷新令牌
        if (res.data.refreshToken) {
          wx.setStorageSync('refreshToken', res.data.refreshToken);
        }
        
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
  
  // 处理获取手机号
  handleGetPhoneNumber: function(e) {
    console.log('手机号获取结果:', e.detail);
    
    // 判断是否成功获取手机号
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 成功获取，开始微信登录流程
      this.setData({
        isWechatLoading: true
      });
      
      // 先获取微信登录code
      wx.login({
        success: (res) => {
          if (res.code) {
            // 判断是否为开发环境（开发工具或体验版）
            if (__wxConfig && __wxConfig.envVersion && 
               (__wxConfig.envVersion === 'develop' || __wxConfig.envVersion === 'trial')) {
              console.log('当前为开发环境，使用模拟手机号');
              // 使用模拟数据进行开发测试
              this.mockPhoneLogin(res.code);
            } else {
              // 使用code和加密的手机号数据进行登录
              this.wechatLoginWithPhone(res.code, e.detail);
            }
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
    } else {
      // 用户拒绝授权手机号，使用普通微信登录
      console.log('用户拒绝授权手机号，使用普通微信登录');
      this.handleWechatLogin();
    }
  },
  
  // 开发环境模拟手机号登录
  mockPhoneLogin: function(code) {
    console.log('使用模拟手机号登录，code:', code);
    
    // 模拟请求后端
    setTimeout(() => {
      // 模拟登录成功
      this.setData({
        isWechatLoading: false
      });
      
      // 模拟用户数据
      const mockUserData = {
        token: 'mock_token_' + Date.now(),
        user: {
          id: 'mock_user_001',
          username: '测试用户',
          phone: '13800138000',  // 模拟手机号
          avatar: '/images/icons/avatar-default.png',
          department: '研发部',
          position: '工程师'
        },
        openid: 'mock_openid_' + Date.now(),
        refreshToken: 'mock_refresh_' + Date.now(),
        auto_bind: true  // 模拟自动绑定
      };
      
      // 存储模拟数据
      wx.setStorageSync('token', mockUserData.token);
      wx.setStorageSync('userInfo', mockUserData.user);
      wx.setStorageSync('openid', mockUserData.openid);
      wx.setStorageSync('refreshToken', mockUserData.refreshToken);
      
      wx.showToast({
        title: '已自动绑定账号(模拟)',
        icon: 'success',
        duration: 1500
      });
      
      // 跳转到首页
      setTimeout(() => {
        this.navigateToIndex();
      }, 1500);
    }, 1000);
  },
  
  // 使用手机号进行微信登录
  wechatLoginWithPhone: function(code, phoneData) {
    userApi.wechatLoginWithPhone(code, phoneData)
      .then(res => {
        this.setData({
          isWechatLoading: false
        });
        
        if (res && res.code === 200 && res.data) {
          // 登录或绑定成功
          wx.setStorageSync('token', res.data.token);
          wx.setStorageSync('userInfo', res.data.user);
          // 存储openid用于后续静默登录
          if (res.data.openid) {
            wx.setStorageSync('openid', res.data.openid);
          }
          // 存储刷新令牌
          if (res.data.refreshToken) {
            wx.setStorageSync('refreshToken', res.data.refreshToken);
          }
          
          // 判断是否是自动绑定
          if (res.data.auto_bind) {
            wx.showToast({
              title: '已自动绑定已有账号',
              icon: 'success',
              duration: 1500
            });
          } else {
            wx.showToast({
              title: '登录成功',
              icon: 'success',
              duration: 1500
            });
          }
          
          // 跳转到首页
          setTimeout(() => {
            this.navigateToIndex();
          }, 1500);
        } else if (res && res.code === 201) {
          // 手机号未关联账号，但已创建微信用户
          wx.showToast({
            title: '请绑定系统账号',
            icon: 'none'
          });
          
          // 跳转到账号绑定页
          wx.navigateTo({
            url: '/pages/account-bind/account-bind?code=' + code
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
  
  handleWechatLogin: function () {
    this.setData({
      isWechatLoading: true
    });
    
    // 调用微信登录获取code
    this.getWxCode(false);
  },
  
  // 获取微信登录code
  getWxCode: function(isSilent) {
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('获取微信code成功: ', res.code);
          
          if (isSilent) {
            // 静默登录模式，直接使用code换取openid
            this.loginWithCode(res.code, null, true);
          } else {
            // 非静默模式，获取用户信息
            this.getUserInfo(res.code);
          }
        } else {
          if (!isSilent) {
            this.setData({
              isWechatLoading: false
            });
            
            wx.showToast({
              title: '微信登录失败',
              icon: 'none'
            });
          }
          
          console.error('微信登录失败', res.errMsg);
        }
      },
      fail: (err) => {
        if (!isSilent) {
          this.setData({
            isWechatLoading: false
          });
          
          wx.showToast({
            title: '微信登录失败',
            icon: 'none'
          });
        }
        
        console.error('微信登录失败', err);
      }
    });
  },
  
  // 获取用户信息（新版API）
  getUserInfo: function(code) {
    // 推荐使用 wx.getUserInfo 获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
    wx.getUserInfo({
      desc: '用于完善用户资料',
      success: (userRes) => {
        console.log('获取用户信息成功: ', userRes);
        
        // 发送code和用户信息到服务器，换取登录态
        this.loginWithCode(code, userRes.userInfo, false);
      },
      fail: (err) => {
        this.setData({
          isWechatLoading: false
        });
        
        if (err.errMsg.indexOf('auth deny') > -1 || err.errMsg.indexOf('deny') > -1) {
          wx.showToast({
            title: '需要您授权才能继续',
            icon: 'none'
          });
        } else {
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
        }
        
        console.error('获取用户信息失败', err);
      }
    });
  },
  
  // 使用code登录
  loginWithCode: function(code, wxUserInfo, isSilent) {
    // 调用微信登录API
    userApi.wechatLogin(code, wxUserInfo, isSilent)
      .then(res => {
        if (!isSilent) {
          this.setData({
            isWechatLoading: false
          });
        }
        
        if (res && res.code === 200 && res.data) {
          // 登录成功，存储信息
          wx.setStorageSync('token', res.data.token);
          wx.setStorageSync('userInfo', res.data.user);
          // 存储openid用于后续静默登录
          if (res.data.openid) {
            wx.setStorageSync('openid', res.data.openid);
          }
          // 存储刷新令牌
          if (res.data.refreshToken) {
            wx.setStorageSync('refreshToken', res.data.refreshToken);
          }
          
          if (!isSilent) {
            wx.showToast({
              title: '登录成功',
              icon: 'success',
              duration: 1500
            });
          }
          
          // 跳转到首页
          setTimeout(() => {
            this.navigateToIndex();
          }, isSilent ? 0 : 1500);
        } else if (res && res.code === 201) {
          // 用户存在但未绑定，显示绑定界面
          console.log('微信用户未绑定系统账号');
          
          if (!isSilent) {
            wx.showToast({
              title: '请绑定系统账号',
              icon: 'none'
            });
            
            // 跳转到账号绑定页
            wx.navigateTo({
              url: '/pages/account-bind/account-bind?code=' + code
            });
          }
        } else {
          if (!isSilent) {
            wx.showToast({
              title: res.message || '微信登录失败',
              icon: 'none'
            });
          }
        }
      })
      .catch(err => {
        if (!isSilent) {
          this.setData({
            isWechatLoading: false
          });
          
          wx.showToast({
            title: err.message || '微信登录失败',
            icon: 'none'
          });
        }
        
        console.error('微信登录失败', err);
      });
  },
  
  navigateToIndex: function () {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
}); 
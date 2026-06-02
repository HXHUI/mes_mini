import { userApi } from '../../utils/api/user.js';

Page({
  data: {
    username: '',
    password: '',
    isBinding: false,
    wxCode: '' // 保存微信code
  },

  onLoad: function (options) {
    // 如果有code参数，保存起来
    if (options.code) {
      this.setData({
        wxCode: options.code
      });
    } else {
      // 没有code，重新获取
      this.getWxCode();
    }
  },

  // 获取微信code
  getWxCode: function() {
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('获取微信code成功: ', res.code);
          this.setData({
            wxCode: res.code
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

  // 处理账号绑定
  handleBind: function () {
    const { username, password, wxCode } = this.data;
    
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
    
    if (!wxCode) {
      wx.showToast({
        title: '微信登录凭证已失效，请重试',
        icon: 'none'
      });
      // 重新获取code
      this.getWxCode();
      return;
    }
    
    this.setData({
      isBinding: true
    });
    
    // 调用绑定API
    userApi.bindWechat(wxCode, username, password)
      .then(res => {
        this.setData({
          isBinding: false
        });
        
        if (res && res.code === 200) {
          // 绑定成功，存储登录信息
          if (res.data) {
            wx.setStorageSync('token', res.data.token);
            
            // 格式化用户信息，确保包含user_id字段
            const userInfo = res.data.user;
            if (userInfo) {
              // 确保包含所有必要的字段
              const formattedUserInfo = {
                id: userInfo.id || '',
                user_id: userInfo.id || 'EMP20230001',
                name: userInfo.real_name || userInfo.username || username,
                real_name: userInfo.real_name || userInfo.username || username,
                username: userInfo.username || username,
                avatar: userInfo.avatar || '/images/icons/avatar-default.png',
                department: userInfo.department || '未设置部门',
                position: userInfo.position || '未设置职位',
                email: userInfo.email || '',
                phone: userInfo.phone || '',
                status: userInfo.status || '',
                wechat_openid: userInfo.wx_openid || '',
                wechat_bound: true, // 绑定成功后设置为已绑定
                originalData: userInfo
              };
              wx.setStorageSync('userInfo', formattedUserInfo);
            }
            
            // 存储openid用于后续静默登录
            if (res.data.openid) {
              wx.setStorageSync('openid', res.data.openid);
            }
            // 存储刷新令牌
            if (res.data.refreshToken) {
              wx.setStorageSync('refreshToken', res.data.refreshToken);
            }
          }
          
          // 显示绑定成功信息，包含用户名
          const userName = res.data && res.data.user ? (res.data.user.name || res.data.user.username || username) : username;
          wx.showToast({
            title: `绑定成功，欢迎 ${userName}`,
            icon: 'success',
            duration: 2000,
            success: () => {
              // 跳转到"我的"页面，让用户看到更新后的用户信息
              setTimeout(() => {
                wx.switchTab({
                  url: '/pages/profile/profile'
                });
              }, 2000);
            }
          });
        } else {
          wx.showToast({
            title: res.message || '绑定失败',
            icon: 'none',
            duration: 2000
          });
        }
      })
      .catch(err => {
        this.setData({
          isBinding: false
        });
        
        console.error('绑定失败', err);
        
        // 优化错误处理，确保显示服务器返回的错误信息
        let errorMessage = '绑定失败，请重试';
        
        // 判断错误对象的类型
        if (err && typeof err === 'object') {
          // 如果是请求模块返回的错误对象
          if (err.message) {
            errorMessage = err.message;
          }
          
          // 如果有服务器返回的数据
          if (err.data && err.data.message) {
            errorMessage = err.data.message;
          }
          
          // 处理特定的错误状态码
          if (err.statusCode === 400) {
            // 检查是否是用户名或密码错误
            if (err.data && err.data.message && err.data.message.includes('用户名或密码错误')) {
              errorMessage = '用户名或密码错误';
            } else {
              // 保持服务器返回的具体错误信息
              errorMessage = err.data && err.data.message ? err.data.message : '请求参数错误';
            }
          } else if (err.statusCode === 403) {
            errorMessage = '账号已禁用，请联系管理员';
          }
        }
        
        wx.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 2500
        });
      });
  },
  
  // 返回登录页
  handleBack: function () {
    wx.navigateBack({
      delta: 1
    });
  }
}); 
// app.js
import { login, getUserInfo } from './utils/auth.js'

App({
  globalData: {
    userInfo: null,
    token: '',
    // 开发环境（本地调试，仅在开发者工具中可用）
    // baseUrl: 'http://localhost:3000/mes',
    // staticUrl: 'http://localhost:3000',
    // 开发环境（内网调试，可在预览模式和真机测试中使用）
    devBaseUrl: 'http://192.168.31.118:3000/mes',
    devStaticUrl: 'http://192.168.31.118:3000',
    // devBaseUrl: 'http://192.168.0.104:3000/mes',
    // devStaticUrl: 'http://192.168.0.104:3000',
    // 生产环境
    prodBaseUrl: 'https://wp.loopflow.cn/mes', // 生产环境API地址
    prodStaticUrl: 'https://wp.loopflow.cn', // 生产环境静态资源地址
    // 默认使用生产环境配置
    baseUrl: 'https://wp.loopflow.cn/mes',
    staticUrl: 'https://wp.loopflow.cn',
    // 图片上传和显示测试配置
    enableImageDebug: true,
    isLoggedIn: false,
    isDev: false // 是否为开发环境
  },

  onLaunch: function() {
    // 打印系统信息用于调试
    wx.getSystemInfo({
      success: (res) => {
        console.log('系统信息:', res);
        this.globalData.systemInfo = res;
        
        // 根据平台和环境切换API地址
        // 在开发者工具中使用开发环境地址，在真机预览和正式版中使用生产环境地址
        const isDevTool = res.platform === 'devtools';
        if (isDevTool) {
          this.globalData.baseUrl = this.globalData.devBaseUrl;
          this.globalData.staticUrl = this.globalData.devStaticUrl;
          this.globalData.isDev = true;
          console.log('当前使用开发环境配置');
        } else {
          this.globalData.baseUrl = this.globalData.prodBaseUrl;
          this.globalData.staticUrl = this.globalData.prodStaticUrl;
          this.globalData.isDev = false;
          console.log('当前使用生产环境配置');
        }
      }
    });
    
    console.log('小程序启动 - 环境配置:', {
      baseUrl: this.globalData.baseUrl,
      staticUrl: this.globalData.staticUrl
    });
    
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 获取本地存储的token
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      this.globalData.isLoggedIn = true
      
      // 验证token有效性
      this.checkSession()
    }
  },

  // 检查登录状态
  checkSession: function() {
    const that = this
    wx.checkSession({
      success: function() {
        // session有效
        console.log('登录状态有效')
      },
      fail: function() {
        // session失效，重新登录
        console.log('登录状态已失效，需要重新登录')
        that.globalData.isLoggedIn = false
        wx.removeStorageSync('token')
        wx.removeStorageSync('refreshToken')
      }
    })
  },

  // 登录方法
  login: function() {
    const that = this
    return new Promise((resolve, reject) => {
      login()
        .then(res => {
          that.globalData.token = res.token
          that.globalData.userInfo = res.userInfo
          that.globalData.isLoggedIn = true
          wx.setStorageSync('token', res.token)
          wx.setStorageSync('userInfo', res.userInfo)
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  },

  // 获取用户信息
  getUserInfo: function() {
    const that = this
    return new Promise((resolve, reject) => {
      if (that.globalData.userInfo) {
        resolve(that.globalData.userInfo)
      } else {
        getUserInfo()
          .then(userInfo => {
            that.globalData.userInfo = userInfo
            wx.setStorageSync('userInfo', userInfo)
            resolve(userInfo)
          })
          .catch(err => {
            reject(err)
          })
      }
    })
  }
}) 
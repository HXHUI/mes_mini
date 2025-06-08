// app.js
import { login, getUserInfo } from './utils/auth.js'

App({
  globalData: {
    userInfo: null,
    token: '',
    // 开发环境
    // baseUrl: 'http://localhost:3000/mes',
    // 生产环境
    baseUrl: 'https://wp.processforce.cn/mes', // 替换为您的实际生产环境API地址
    isLoggedIn: false
  },

  onLaunch: function() {
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
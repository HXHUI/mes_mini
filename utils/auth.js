// auth.js
import { userApi } from './api'

// 登录
export const login = () => {
  return new Promise((resolve, reject) => {
    // 微信登录
    wx.login({
      success: (res) => {
        if (res.code) {
          // 获取用户信息
          getUserProfile()
            .then(userInfo => {
              // 发送code到后端获取token
              userApi.login({
                code: res.code,
                userInfo
              })
                .then(response => {
                  resolve({
                    token: response.data.token,
                    userInfo: response.data.userInfo
                  })
                })
                .catch(err => {
                  reject(err)
                })
            })
            .catch(err => {
              reject(err)
            })
        } else {
          reject(res.errMsg)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 获取用户信息
export const getUserInfo = () => {
  return new Promise((resolve, reject) => {
    userApi.getUserInfo()
      .then(res => {
        resolve(res.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 获取用户资料（包括头像、昵称等）
export const getUserProfile = () => {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        resolve(res.userInfo)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 检查登录状态
export const checkLogin = () => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    if (!token) {
      reject(new Error('未登录'))
      return
    }
    
    wx.checkSession({
      success: () => {
        // session有效
        resolve(true)
      },
      fail: () => {
        // session无效
        wx.removeStorageSync('token')
        wx.removeStorageSync('userInfo')
        reject(new Error('登录已过期'))
      }
    })
  })
} 
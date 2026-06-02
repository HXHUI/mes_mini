// request.js - 网络请求封装
import { userApi } from './api/user.js'

// 是否正在刷新token
let isRefreshing = false
// 等待token刷新的请求队列
let requestsQueue = []

// 执行被挂起的请求
const executeQueue = (token) => {
  requestsQueue.forEach(cb => cb(token))
  requestsQueue = []
}

/**
 * 封装微信请求方法
 * @param {Object} options - 请求配置
 * @param {string} options.url - 请求URL
 * @param {string} options.method - 请求方法 GET, POST, PUT, DELETE 等
 * @param {Object} options.data - 请求数据
 * @param {boolean} options.showLoading - 是否显示加载提示
 * @returns {Promise} - 返回Promise对象
 */
export const request = (options) => {
  // 默认显示加载提示
  if (options.showLoading !== false) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    })
  }

  // 获取全局数据
  const app = getApp()
  const baseUrl = app.globalData.baseUrl || ''
  
  // 构建完整URL
  const url = (options.url.startsWith('http') ? options.url : baseUrl + options.url)
  
  // 获取token
  const token = wx.getStorageSync('token')
  
  // 获取用户ID
  const userInfo = wx.getStorageSync('userInfo') || {}
  const userId = userInfo.id || userInfo.userId || userInfo.user_id || ''
  
  // 添加userId作为URL参数
  const separator = url.includes('?') ? '&' : '?'
  const finalUrl = userId ? `${url}${separator}userId=${userId}` : url
  
  // 输出请求信息，帮助调试
  console.log('请求URL:', finalUrl)
  console.log('用户ID:', userId)
  
  return new Promise((resolve, reject) => {
    const requestTask = wx.request({
      url: finalUrl,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'x-user-id': userId
      },
      success: (res) => {
        if (options.showLoading !== false) {
          wx.hideLoading()
        }
        
        // 根据业务状态码处理结果
        if (res.statusCode === 200 || res.statusCode === 201) {
          // 业务状态判断，根据实际后端接口规范调整
          if (res.data.code === 200 || res.data.code === 201 || res.data.code === 0 || !res.data.code) {
            resolve(res.data)
          } else if (res.data.code === 401) {
            // 尝试刷新token
            handleTokenRefresh(options, resolve, reject)
          } else {
            // 其他业务错误
            const errMsg = res.data.message || '请求失败'
            if (options.showError !== false) {
              wx.showToast({
                title: errMsg,
                icon: 'none',
                duration: 2000
              })
            }
            reject(new Error(errMsg))
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          // 尝试刷新token
          handleTokenRefresh(options, resolve, reject)
        } else if (res.statusCode === 400) {
          // 处理400错误，通常是请求参数错误或业务逻辑错误
          const errMsg = res.data.message || '请求参数错误'
          if (options.showError !== false) {
            wx.showToast({
              title: errMsg,
              icon: 'none',
              duration: 2000
            })
          }
          // 将完整的响应数据传递给reject，便于调用方获取更多信息
          reject({
            message: errMsg,
            data: res.data,
            statusCode: res.statusCode
          })
        } else {
          // 其他HTTP状态码错误
          const errMsg = `请求失败: ${res.statusCode}`
          if (options.showError !== false) {
            wx.showToast({
              title: errMsg,
              icon: 'none',
              duration: 2000
            })
          }
          reject(new Error(errMsg))
        }
      },
      fail: (err) => {
        if (options.showLoading !== false) {
          wx.hideLoading()
        }
        
        if (options.showError !== false) {
          wx.showToast({
            title: '网络错误，请检查网络连接',
            icon: 'none',
            duration: 2000
          })
        }
        
        reject(err)
      }
    })
  })
}

// 处理token刷新
const handleTokenRefresh = (options, resolve, reject) => {
  // 获取refreshToken
  const refreshToken = wx.getStorageSync('refreshToken')
  
  // 如果没有refreshToken，直接跳转到登录页
  if (!refreshToken) {
    handleLogout(options, reject)
    return
  }
  
  // 判断是否正在刷新token
  if (isRefreshing) {
    // 将请求加入队列
    requestsQueue.push((token) => {
      request(Object.assign({}, options, {
        header: Object.assign({}, options.header, {
          'Authorization': `Bearer ${token}`
        })
      })).then(resolve).catch(reject)
    })
    return
  }
  
  // 开始刷新token
  isRefreshing = true
  
  // 调用刷新token接口
  userApi.refreshToken(refreshToken)
    .then(res => {
      isRefreshing = false
      
      if (res && res.data && res.data.token) {
        // 更新本地存储的token
        wx.setStorageSync('token', res.data.token)
        if (res.data.refreshToken) {
          wx.setStorageSync('refreshToken', res.data.refreshToken)
        }
        
        // 执行队列中的请求
        executeQueue(res.data.token)
        
        // 重试当前请求
        request(options).then(resolve).catch(reject)
      } else {
        // 刷新token失败，跳转到登录页
        handleLogout(options, reject)
      }
    })
    .catch(() => {
      isRefreshing = false
      // 刷新token出错，跳转到登录页
      handleLogout(options, reject)
    })
}

// 处理退出登录
const handleLogout = (options, reject) => {
  // 清除登录状态
  wx.removeStorageSync('token')
  wx.removeStorageSync('refreshToken')
  wx.removeStorageSync('userInfo')
  
  // 跳转到登录页，但避免在登录页面再次跳转造成循环
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const isLoginPage = currentPage && currentPage.route && currentPage.route.includes('login')
  
  if (!isLoginPage) {
    wx.showToast({
      title: '登录状态已失效，请重新登录',
      icon: 'none',
      duration: 2000
    })
    
    // 使用reLaunch跳转到登录页
    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/login/login'
      })
    }, 2000)
  }
  
  // 抛出错误
  if (options.showError !== false) {
    reject(new Error('登录状态已失效，请重新登录'))
  }
}

/**
 * GET请求简化方法
 * @param {string} url - 请求URL
 * @param {Object} data - 请求数据
 * @param {Object} options - 其他选项
 * @returns {Promise}
 */
export const get = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  })
}

/**
 * POST请求简化方法
 * @param {string} url - 请求URL
 * @param {Object} data - 请求数据
 * @param {Object} options - 其他选项
 * @returns {Promise}
 */
export const post = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  })
}

/**
 * PUT请求简化方法
 * @param {string} url - 请求URL
 * @param {Object} data - 请求数据
 * @param {Object} options - 其他选项
 * @returns {Promise}
 */
export const put = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  })
} 
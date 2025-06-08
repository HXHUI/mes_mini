// request.js - 网络请求封装

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
  
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
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
            // 未授权，清除登录状态
            wx.removeStorageSync('token')
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
              
              // 使用switchTab跳转到登录页
              setTimeout(() => {
                wx.reLaunch({
                  url: '/pages/login/login'
                })
              }, 2000)
            }
            
            reject(new Error('登录状态已失效，请重新登录'))
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
          // HTTP 401/403 错误，清除登录状态
          wx.removeStorageSync('token')
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
          
          reject(new Error('登录状态已失效，请重新登录'))
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
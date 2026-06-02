import { request } from '../request.js'

// 用户相关API
const userApi = {
  // 获取用户信息
  getUserInfo() {
    return request({
      url: '/api/user/info',
      method: 'GET'
    })
  },
  
  // 账号密码登录
  login(data) {
    return request({
      url: '/api/login',
      method: 'POST',
      data: {
        username: data.username,
        password: data.password
      }
    })
  },
  
  // 微信登录
  wechatLogin(code, userInfo, isSilent = false) {
    return request({
      url: '/api/login/wechat',
      method: 'POST',
      data: {
        code,
        silent: isSilent,
        userInfo: userInfo ? {
          phone: userInfo.phone || '',
          name: userInfo.nickName || '',
          avatar: userInfo.avatarUrl || ''
        } : null
      },
      showLoading: !isSilent, // 静默登录不显示加载提示
      showError: !isSilent    // 静默登录不显示错误提示
    })
  },
  
  // 微信手机号登录（自动绑定已有账号）
  wechatLoginWithPhone(code, phoneData) {
    return request({
      url: '/api/login/wechat/phone',
      method: 'POST',
      data: {
        code,
        encryptedData: phoneData.encryptedData,
        iv: phoneData.iv,
        cloudID: phoneData.cloudID
      }
    })
  },
  
  // 使用openid静默登录
  wechatSilentLogin(openid) {
    return request({
      url: '/api/login/wechat/silent',
      method: 'POST',
      data: {
        openid
      },
      showLoading: false,
      showError: false
    })
  },
  
  // 绑定微信账号
  bindWechat(code, username, password) {
    return request({
      url: '/api/user/bind/wechat',
      method: 'POST',
      data: {
        code,
        username,
        password
      }
    })
  },
  
  // 使用手机号绑定微信账号
  bindWechatWithPhone(code, phone) {
    return request({
      url: '/api/user/bind/wechat/phone',
      method: 'POST',
      data: {
        code,
        phone
      }
    })
  },
  
  // 解绑微信账号
  unbindWechat() {
    return request({
      url: '/api/user/unbind/wechat',
      method: 'POST'
    })
  },
  
  // 检查登录状态
  checkLoginStatus() {
    return request({
      url: '/api/user/check',
      method: 'GET'
    })
  },
  
  // 退出登录
  logout() {
    return request({
      url: '/api/logout',
      method: 'POST'
    })
  },
  
  // 刷新令牌
  refreshToken(refreshToken) {
    return request({
      url: '/api/refresh-token',
      method: 'POST',
      data: {
        refresh_token: refreshToken
      },
      showLoading: false,
      showError: false
    })
  }
}

export { userApi }; 
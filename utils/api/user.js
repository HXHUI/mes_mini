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
  wechatLogin(code, userInfo) {
    return request({
      url: '/api/login/wechat',
      method: 'POST',
      data: {
        code,
        userInfo: {
          phone: userInfo.phone || '',
          name: userInfo.nickName || '',
          avatar: userInfo.avatarUrl || ''
        }
      }
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
  }
}

export { userApi }; 
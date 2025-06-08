// api.js
import { request } from './request.js'

// 设备相关API
const deviceApi = {
  // 根据二维码获取设备信息
  getDeviceByQrCode(code) {
    return request({
      url: `/api/device/qrcode/${code}`,
      method: 'GET'
    })
  },
  
  // 获取设备详情
  getDeviceDetail(deviceId) {
    return request({
      url: `/api/device/${deviceId}`,
      method: 'GET'
    })
  },
  
  // 获取设备列表
  getDeviceList(params) {
    return request({
      url: '/api/device',
      method: 'GET',
      data: params
    })
  }
}

// 故障申报相关API
const repairApi = {
  // 提交故障申报
  submitFaultReport(data) {
    return request({
      url: '/api/device-work-order',
      method: 'POST',
      data: {
        device_id: data.device_id,
        type: 'REPAIR', // 固定为维修类型
        fault_type: data.fault_type,
        urgency_level: data.urgency,
        description: data.description,
        creator_name: data.contact_name,
        creator_phone: data.contact_phone,
        assigned_to: null, // 初始为空，由后台指派
        scheduled_start: null,
        scheduled_end: null,
        status: 'pending'
      }
    })
  },
  
  // 获取故障申报记录列表
  getRepairOrderList(params) {
    return request({
      url: '/api/device-work-order',
      method: 'GET',
      data: {
        ...params,
        type: 'REPAIR' // 默认只查询维修类型的工单
      }
    })
  },
  
  // 获取故障申报详情
  getRepairOrderDetail(id) {
    return request({
      url: `/api/device-work-order/${id}`,
      method: 'GET'
    })
  },
  
  // 上传工单图片
  uploadWorkOrderImages(orderId, filePaths) {
    const uploadTasks = filePaths.map(filePath => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: getApp().globalData.baseUrl + `/api/device-work-order/${orderId}/images`,
          filePath,
          name: 'files',
          header: {
            'Authorization': 'Bearer ' + wx.getStorageSync('token')
          },
          success(res) {
            try {
              const data = JSON.parse(res.data)
              if (data.code === 201) {
                resolve(data.data)
              } else {
                reject(data.message || '上传失败')
              }
            } catch (e) {
              reject('解析响应失败')
            }
          },
          fail(err) {
            reject(err)
          }
        })
      })
    })
    
    return Promise.all(uploadTasks)
  }
}

// 用户相关API
const userApi = {
  // 获取用户信息
  getUserInfo() {
    return request({
      url: '/api/user/info',
      method: 'GET'
    })
  },
  
  // 登录
  login(data) {
    return request({
      url: '/api/login',
      method: 'POST',
      data
    })
  },
  
  // 微信登录
  wechatLogin(code, userInfo) {
    return request({
      url: '/api/login/wechat',
      method: 'POST',
      data: {
        code,
        userInfo
      }
    })
  }
}

export {
  deviceApi,
  repairApi,
  userApi
} 
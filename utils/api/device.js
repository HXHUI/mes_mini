import { request } from '../request.js'

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

export { deviceApi }; 
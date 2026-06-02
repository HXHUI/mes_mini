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
  },
  
  // 获取设备维修记录
  getDeviceRepairRecords(deviceId) {
    return request({
      url: `/api/device/${deviceId}/repairs`,
      method: 'GET'
    })
  },
  
  // 获取设备维修保养记录
  getDeviceRecords(deviceId) {
    return request({
      url: `/api/device/${deviceId}/records`,
      method: 'GET',
      data: {
        include_maintenance: true,
        include_repair: true
      }
    })
  },
  
  // 获取设备参数
  getDeviceParameters(deviceId) {
    return request({
      url: `/api/device-parameter/device/${deviceId}`,
      method: 'GET'
    })
  },
  
  // 获取设备参数及其最新值（新接口）
  getDeviceParametersWithValues(deviceId) {
    return request({
      url: `/api/device/${deviceId}/parameters`,
      method: 'GET'
    })
  },
  
  // 获取设备参数历史数据
  getParameterHistory(deviceId, paramCodes, options = {}) {
    return request({
      url: '/api/device-parameter/history',
      method: 'GET',
      data: {
        deviceId,
        paramCodes: paramCodes.join(','),
        start: options.start || '-2h',  // 默认获取最近2小时的数据
        interval: options.interval || '5m'  // 默认5分钟一个点
      }
    })
  },
  
  // 获取设备最新参数值
  getDeviceLatestMetrics(deviceId, params) {
    return request({
      url: `/api/device/${deviceId}/metrics/latest`,
      method: 'GET',
      data: {
        params: Array.isArray(params) ? JSON.stringify(params) : params
      }
    })
  }
}

export { deviceApi }; 
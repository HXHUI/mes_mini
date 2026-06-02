import { request } from '../request.js'

// 维修和工单相关API
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
        creator_id: data.creator_id,
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
  },
  
  // 获取工单列表
  getWorkOrders(params) {
    return request({
      url: '/api/device-work-order',
      method: 'GET',
      data: params
    })
  },
  
  // 获取工单列表，按状态筛选
  getWorkOrderList(status, page = 1, limit = 10) {
    return request({
      url: '/api/device-work-order',
      method: 'GET',
      data: {
        type: 'REPAIR', // 默认只查询维修类型的工单
        status: status,
        page: page,
        pageSize: limit
      }
    })
  },
  
  // 获取待处理工单列表
  getPendingWorkOrders(page = 1, limit = 10) {
    return request({
      url: '/api/device-work-order',
      method: 'GET',
      data: {
        type: 'REPAIR',
        status: 'pending',
        page: page,
        pageSize: limit
      }
    })
  },
  
  // 获取处理中工单列表
  getProcessingWorkOrders(page = 1, limit = 10) {
    return request({
      url: '/api/device-work-order',
      method: 'GET',
      data: {
        type: 'REPAIR',
        status: 'in_progress',
        page: page,
        pageSize: limit
      }
    })
  },
  
  // 更新工单状态
  updateWorkOrderStatus(orderId, status, data = {}) {
    return request({
      url: `/api/device-work-order/${orderId}`,
      method: 'PUT',
      data: {
        status: status,
        ...data
      }
    })
  },
  
  // 接单处理
  acceptWorkOrder(orderId, assigned_to) {
    return request({
      url: `/api/device-work-order/${orderId}/accept`,
      method: 'POST',
      data: {
        assigned_to
      }
    });
  },
  
  // 开始处理维修工单
  startWorkOrder(orderId,actual_start) {
    return request({
      url: `/api/device-work-order/${orderId}`,
      method: 'PUT',
      data: {
        actual_start,
        status: 'in_progress'
      }
    });
  },
  
  // 完成工单
  completeWorkOrder(orderId, completionData) {
    return this.updateWorkOrderStatus(orderId, 'completed', completionData);
  },
  
  // 获取工单图片
  getWorkOrderImages(orderId) {
    return request({
      url: `/api/device-work-order/${orderId}/images`,
      method: 'GET'
    });
  }
}

export { repairApi }; 
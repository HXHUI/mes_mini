import { get, post, put } from '../request.js'

// 设备工单相关API
export const deviceWorkOrderApi = {
  /**
   * 获取当前用户今日的工单统计信息
   * @returns {Promise} 包含工单统计数据的Promise
   */
  getTodayStatistics: () => {
    return get('/api/device-work-order/user/today-statistics')
  },

  /**
   * 获取工单列表
   * @param {Object} params - 查询参数
   * @param {string} params.status - 状态：pending, in_progress, completed, accepted, canceled
   * @param {number} params.page - 页码
   * @param {number} params.size - 每页数量
   * @returns {Promise} 包含工单列表的Promise
   */
  getWorkOrders: (params) => {
    return get('/api/device-work-order/list', params)
  },
  
  /**
   * 搜索工单列表
   * @param {Object} params - 搜索参数
   * @param {number} params.device_id - 设备ID筛选
   * @param {string} params.type - 工单类型筛选 (MAINTENANCE/REPAIR/OTHER)，不传或为空时获取所有类型
   * @param {string} params.status - 状态筛选
   * @param {string} params.keyword - 关键字搜索（可搜索设备编号、设备名称、工单描述）
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @returns {Promise} 包含工单列表的Promise
   */
  searchWorkOrders: (params) => {
    return get('/api/device-work-order', params)
  },
  
  /**
   * 获取工单详情
   * @param {string} id - 工单ID
   * @returns {Promise} 包含工单详情的Promise
   */
  getWorkOrderDetail: (id) => {
    return get(`/api/device-work-order/${id}`)
  },
  
  /**
   * 更新工单信息
   * @param {string} id - 工单ID
   * @param {Object} data - 更新的数据
   * @returns {Promise} 包含更新结果的Promise
   */
  updateWorkOrder: (id, data) => {
    return put(`/api/device-work-order/${id}`, data)
  },
  
  /**
   * 获取工单图片
   * @param {string} id - 工单ID
   * @returns {Promise} 包含工单图片的Promise
   */
  getWorkOrderImages: (id) => {
    return get(`/api/device-work-order/${id}/images`)
  },

  /**
   * 工单验收
   * @param {string} id - 工单ID
   * @param {Object} data - 验收数据
   * @param {boolean} data.is_passed - 是否通过验收
   * @param {number} data.score - 评分分值(0-100)
   * @param {string} data.acceptance_description - 验收说明
   * @returns {Promise} 包含验收结果的Promise
   */
  acceptance: (id, data) => {
    return post(`/api/device-work-order/${id}/acceptance`, data)
  },

  /**
   * 获取工单验收信息
   * @param {string} id - 工单ID
   * @returns {Promise} 包含验收信息的Promise
   */
  getAcceptance: (id) => {
    return get(`/api/device-work-order/${id}/acceptance`)
  }
} 
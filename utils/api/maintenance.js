import { request } from '../request.js'

// 保养相关API
const maintenanceApi = {
  // 提交保养工单
  submitMaintenanceOrder(data) {
    return request({
      url: '/api/device-work-order',
      method: 'POST',
      data: {
        device_id: data.device_id,
        type: 'MAINTENANCE', // 固定为保养类型
        maintenance_type: data.maintenance_type,
        priority_level: data.priority,
        description: data.description,
        creator_id: data.creator_id,
        creator_phone: data.contact_phone,
        assigned_to: data.assigned_to || null,
        scheduled_start: data.scheduled_start || null,
        scheduled_end: data.scheduled_end || null,
        status: 'pending'
      }
    })
  },
  
  // 获取保养工单列表
  getMaintenanceOrders(params) {
    return request({
      url: '/api/device-work-order',
      method: 'GET',
      data: {
        ...params,
        type: 'MAINTENANCE' // 默认只查询保养类型的工单
      }
    })
  },
  
  // 获取保养工单详情
  getMaintenanceOrderDetail(id) {
    return request({
      url: `/api/device-work-order/${id}`,
      method: 'GET'
    })
  },
  
  // 获取保养工单任务列表
  getMaintenanceTasks(orderId) {
    return request({
      url: `/api/device-work-order/${orderId}/tasks`,
      method: 'GET'
    })
  },
  
  // 开始保养任务
  startMaintenanceTask(orderId, taskId) {
    return request({
      url: `/api/device-work-order/${orderId}/task/${taskId}/status`,
      method: 'PUT',
      data: {
        status: 'in_progress',
        started_at: new Date().toISOString()
      }
    })
  },
  
  // 完成保养任务
  completeMaintenanceTask(orderId, taskId, data) {
    return request({
      url: `/api/device-work-order/${orderId}/task/${taskId}/status`,
      method: 'PUT',
      data: {
        status: 'completed',
        actual_time: data.actual_time,
        completed_at: new Date().toISOString(),
        notes: data.notes || ''
      }
    })
  },
  
  // 跳过保养任务
  skipMaintenanceTask(orderId, taskId, reason) {
    return request({
      url: `/api/device-work-order/${orderId}/task/${taskId}/status`,
      method: 'PUT',
      data: {
        status: 'skipped',
        skipped_at: new Date().toISOString(),
        skip_reason: reason || '无需执行'
      }
    })
  },
  
  // 更新保养任务（直接更新任务信息）
  updateMaintenanceTask(taskId, data) {
    return request({
      url: `/api/device-work-order/tasks/${taskId}`,
      method: 'PUT',
      data: {
        task_name: data.task_name,
        task_order: data.task_order,
        standard_time: data.standard_time,
        actual_time: data.actual_time,
        status: data.status
      }
    })
  },
  
  // 接单处理
  acceptMaintenanceOrder(orderId, assigned_to, assignment_type = 'self_assigned', assigned_by = null) {
    return request({
      url: `/api/device-work-order/${orderId}/accept`,
      method: 'POST',
      data: {
        assigned_to,
        assignment_type,
        assigned_by
      }
    });
  },
  
  // 开始保养工单
  startMaintenanceOrder(orderId,actual_start) {
    
    return request({
      url: `/api/device-work-order/${orderId}`,
      method: 'PUT',
      data: {
        actual_start,
        status: 'in_progress'
      }
    });
  },
  
  // 完成保养工单
  completeMaintenanceOrder(orderId, completionData) {
    return request({
      url: `/api/device-work-order/${orderId}`,
      method: 'PUT',
      data: {
        status: 'completed',
        actual_end: completionData.actual_end,
        handle_description: completionData.handle_description || '',
        solution_description: completionData.solution_description || '',
        used_materials: completionData.used_materials || ''
      }
    });
  }
}

export { maintenanceApi }; 
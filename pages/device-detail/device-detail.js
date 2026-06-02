// 引入API模块
import { deviceApi } from '../../utils/api/device.js'
import { formatDate, parseDate } from '../../utils/util.js'
import { deviceWorkOrderApi } from '../../utils/api/device-work-order.js'

Page({
  data: {
    deviceId: '',
    deviceInfo: null,
    isLoading: true,
    repairRecords: [],
    filteredRecords: [],
    recordFilter: 'all', // 默认显示全部记录
    deviceParameters: [], // 设备参数列表
    statusMap: {
      'active': { text: '正常运行', status: 'normal' },
      'fault': { text: '故障中', status: 'fault' },
      'maintenance': { text: '维护中', status: 'fault' },
      'inactive': { text: '已停用', status: 'fault' }
    }
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({
        deviceId: options.id
      });
      this.loadDeviceInfo(options.id);
    } else {
      wx.showToast({
        title: '设备ID不能为空',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },
  
  onPullDownRefresh: function() {
    this.loadDeviceInfo(this.data.deviceId);
    wx.stopPullDownRefresh();
  },
  
  loadDeviceInfo: function (deviceId) {
    this.setData({
      isLoading: true
    });
    
    deviceApi.getDeviceDetail(deviceId)
      .then(res => {
        if (res && res.code === 200 && res.data) {
          // 处理返回的设备详情数据
          const deviceInfo = res.data;
          
          // 设置设备状态
          const statusInfo = this.data.statusMap[deviceInfo.status] || { 
            text: '未知状态', 
            status: 'fault' 
          };
          
          // 格式化日期
          const formattedCreatedAt = deviceInfo.created_at ? 
            formatDate(parseDate(deviceInfo.created_at)) : 
            '未知';
          
          // 处理设备类型显示
          const deviceTypeMap = {
            'production': '生产设备',
            'testing': '检测设备',
            'office': '办公设备',
            'other': '其他设备'
          };
          
          this.setData({
            deviceInfo: {
              ...deviceInfo,
              statusText: statusInfo.text,
              status: statusInfo.status,
              created_at: formattedCreatedAt,
              deviceTypeText: deviceTypeMap[deviceInfo.device_type] || deviceInfo.device_type || '未知'
            },
            isLoading: false
          });
          
          // 加载设备相关的维修记录
          this.loadDeviceRecords(deviceInfo.device_id);
          
          // 加载设备参数
          this.loadDeviceParameters(deviceInfo.device_id);
        } else {
          wx.showToast({
            title: '获取设备信息失败',
            icon: 'none'
          });
          this.setData({
            isLoading: false
          });
        }
      })
      .catch(err => {
        console.error('获取设备详情失败:', err);
        wx.showToast({
          title: '获取设备详情失败',
          icon: 'none'
        });
        
        // 使用模拟数据（仅用于演示）
        this.setMockData();
        this.setData({
          isLoading: false
        });
      });
  },
  
  // 加载设备参数
  loadDeviceParameters: function(deviceId) {
    // 使用新接口一次性获取设备参数及其最新值
    deviceApi.getDeviceParametersWithValues(deviceId)
      .then(res => {
        if (res && res.code === 200 && res.data && res.data.parameters) {
          // 处理参数数据
          const parameters = res.data.parameters.map(param => {
            return {
              name: param.param_name,
              value: param.latest_value !== null ? param.latest_value : '--',
              unit: param.param_unit || '',
              code: param.param_key,
              timestamp: param.latest_value_time ? formatDate(parseDate(param.latest_value_time)) : null
            };
          });
          
          this.setData({
            deviceParameters: parameters,
            'deviceInfo.parameters': parameters
          });
          
          console.log('已加载设备参数及其最新值', parameters);
        } else {
          console.log('获取设备参数失败或无参数数据');
        }
      })
      .catch(err => {
        console.error('获取设备参数失败:', err);
      });
  },
  
  // 获取设备参数的最新值
  loadLatestParameterValues: function(deviceId, parameters) {
    // 提取参数代码列表
    const paramCodes = parameters.map(param => param.code).filter(code => code);
    
    if (paramCodes.length === 0) {
      return; // 如果没有参数代码，则不进行查询
    }
    
    // 调用获取最新参数值的API
    deviceApi.getDeviceLatestMetrics(deviceId, paramCodes)
      .then(res => {
        if (res && res.code === 200 && res.data && res.data.values) {
          // 格式化时间戳
          const formattedTimestamp = res.data.timestamp ? 
            formatDate(parseDate(res.data.timestamp)) : 
            '未知';
            
          // 更新参数值
          const updatedParameters = this.data.deviceParameters.map(param => {
            // 如果API返回了该参数的值，则更新
            if (param.code && res.data.values[param.code] !== undefined) {
              return {
                ...param,
                value: res.data.values[param.code],
                timestamp: formattedTimestamp
              };
            }
            return param;
          });
          
          // 更新设备参数
          this.setData({
            deviceParameters: updatedParameters,
            'deviceInfo.parameters': updatedParameters
          });
          
          console.log('已更新设备参数最新值', updatedParameters);
        } else {
          console.log('获取设备参数最新值失败或无数据');
        }
      })
      .catch(err => {
        console.error('获取设备参数最新值失败:', err);
      });
  },
  
  // 设置模拟数据（仅用于演示）
  setMockData: function() {
    const mockDevice = {
      id: 132,
      device_id: "Z0020",
      device_name: "4#收卷",
      device_type: "production",
      department: null,
      description: "用于薄膜卷取的设备，最大卷径500mm",
      location: null,
      status: "active",
      created_at: "2025-05-07 21:36:46",
      updated_at: "2025-05-06-08 12:08:35",
      statusText: '正常运行',
      status: 'normal',
      deviceTypeText: '生产设备',
      parameters: [
        { name: '最大卷径', value: '500', unit: 'mm', code: 'max_diameter' },
        { name: '最大速度', value: '120', unit: 'm/min', code: 'max_speed' },
        { name: '电机功率', value: '7.5', unit: 'kW', code: 'motor_power' },
        { name: '张力范围', value: '50-500', unit: 'N', code: 'tension_range' }
      ]
    };
    
    this.setData({
      deviceInfo: mockDevice,
      deviceParameters: mockDevice.parameters
    });
    
    // 同时设置模拟维修保养记录
    const mockRecords = [
      {
        id: 'R001',
        time: '2023-04-20 14:30',
        description: '设备漏油维修',
        handler: '张工程师',
        status: '已完成',
        record_type: 'repair'
      },
      {
        id: 'M001',
        time: '2023-03-15 10:20',
        description: '季度常规保养',
        handler: '李工程师',
        status: '已完成',
        record_type: 'maintenance'
      },
      {
        id: 'R002',
        time: '2023-02-10 09:15',
        description: '电机更换',
        handler: '王维修',
        status: '已完成',
        record_type: 'repair'
      },
      {
        id: 'M002',
        time: '2023-01-05 11:30',
        description: '月度常规保养',
        handler: '赵工程师',
        status: '已完成',
        record_type: 'maintenance'
      }
    ];
    
    this.setData({
      repairRecords: mockRecords
    });
    
    // 应用筛选
    this.filterRecords();
  },
  
  // 加载设备维修保养记录
  loadDeviceRecords: function(deviceId) {
    // 使用工单搜索API获取设备的维修保养记录
    deviceWorkOrderApi.searchWorkOrders({
      device_id: deviceId,
      pageSize: 50, // 获取较多记录以便显示历史
      page: 1,
      // 不指定type参数，获取所有类型的工单（维修和保养）
    })
      .then(res => {
        if (res && res.code === 200 && res.data && res.data.list) {
          // 处理并格式化维修保养记录数据
          const records = res.data.list.map(order => {
            // 根据工单类型确定记录类型
            const recordType = order.type === 'MAINTENANCE' ? 'maintenance' : 'repair';
            
            return {
              id: order.id,
              order_no: order.order_no,
              time: formatDate(parseDate(order.created_at)),
              description: order.title || order.description || '未知工单',
              handler: order.assigned_to_name || '未分配',
              status: this.mapOrderStatusToText(order.status),
              record_type: recordType
            };
          });
          
          // 按时间倒序排序，最新的在前面
          records.sort((a, b) => {
            const dateA = parseDate(a.time);
            const dateB = parseDate(b.time);
            return dateB - dateA;
          });
          
          this.setData({
            repairRecords: records
          });
          
          // 应用筛选
          this.filterRecords();
        } else {
          // 使用模拟数据
          this.setMockData();
        }
      })
      .catch(err => {
        console.error('获取维修保养记录失败:', err);
        // 使用模拟数据
        this.setMockData();
      });
  },
  
  // 将工单状态映射为显示文本
  mapOrderStatusToText: function(status) {
    const statusMap = {
      'pending': '待处理',
      'in_progress': '处理中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || '未知状态';
  },
  
  // 设置记录筛选类型
  setRecordFilter: function(e) {
    const filterType = e.currentTarget.dataset.type;
    this.setData({
      recordFilter: filterType
    });
    
    // 应用筛选
    this.filterRecords();
  },
  
  // 根据筛选条件过滤记录
  filterRecords: function() {
    const { repairRecords, recordFilter } = this.data;
    
    if (recordFilter === 'all') {
      this.setData({
        filteredRecords: repairRecords
      });
    } else {
      const filtered = repairRecords.filter(record => record.record_type === recordFilter);
      this.setData({
        filteredRecords: filtered
      });
    }
  },

  viewRecordDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    // 从记录数据中获取工单类型，确保传递正确的类型参数
    const recordIndex = this.data.filteredRecords.findIndex(record => record.id == id);
    if (recordIndex !== -1) {
      const record = this.data.filteredRecords[recordIndex];
      const recordType = record.record_type === 'maintenance' ? 'MAINTENANCE' : 'REPAIR';
      
      wx.navigateTo({
        url: `/pages/order-detail/order-detail?id=${id}&type=${recordType}`
      });
    } else {
      wx.showToast({
        title: '未找到工单信息',
        icon: 'none'
      });
    }
  },
  
  // 查看参数历史
  viewParameterHistory: function(e) {
    const paramCode = e.currentTarget.dataset.code;
    const paramName = e.currentTarget.dataset.name;
    
    wx.navigateTo({
      url: `/pages/parameter-history/parameter-history?deviceId=${this.data.deviceInfo.device_id}&paramCode=${paramCode}&paramName=${paramName}`
    });
  },
  
  // 刷新设备参数
  refreshParameters: function() {
    if (this.data.deviceId) {
      wx.showLoading({
        title: '刷新参数中',
      });
      
      // 重新加载参数和最新值
      this.loadDeviceParameters(this.data.deviceId);
      
      setTimeout(() => {
        wx.hideLoading();
        wx.showToast({
          title: '参数已更新',
          icon: 'success'
        });
      }, 1000);
    }
  },
  
  // 分享功能
  onShareAppMessage: function () {
    return {
      title: `设备详情：${this.data.deviceInfo.device_name}`,
      path: `/pages/device-detail/device-detail?id=${this.data.deviceId}`
    };
  }
}) 
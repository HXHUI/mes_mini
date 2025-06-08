// 引入API模块
import { deviceApi } from '../../utils/api/device.js'

Page({
  data: {
    deviceId: '',
    deviceInfo: null,
    isLoading: true,
    repairRecords: []
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({
        deviceId: options.id
      });
      this.loadDeviceInfo(options.id);
    }
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
          const status = deviceInfo.status === 'active' ? 'normal' : 'fault';
          
          this.setData({
            deviceInfo: {
              ...deviceInfo,
              statusText: status === 'normal' ? '正常运行' : '故障中',
              status: status
            },
            isLoading: false
          });
          
          // 加载设备相关的维修记录
          this.loadRepairRecords(deviceId);
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
  
  // 设置模拟数据（仅用于演示）
  setMockData: function() {
    const mockDevice = {
      id: 132,
      device_id: "NHD0001",
      device_name: "电表",
      device_type: "other",
      department: null,
      description: null,
      location: null,
      status: "active",
      created_at: "2025-05-07 21:36:46",
      updated_at: "2025-05-06-08 12:08:35",
      statusText: '正常运行'
    };
    
    this.setData({
      deviceInfo: mockDevice
    });
  },
  
  // 加载维修记录
  loadRepairRecords: function(deviceId) {
    // 这里应该调用API获取设备的维修记录
    // 这里使用模拟数据
    this.setData({
      repairRecords: [
        {
          id: 'R001',
          time: '2023-04-20 14:30',
          description: '设备漏油维修',
          handler: '张工程师'
        },
        {
          id: 'R002',
          time: '2023-02-10 09:15',
          description: '电机更换',
          handler: '王维修'
        }
      ]
    });
  },

  viewRepairDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}&type=repair`
    });
  },

  reportFault: function () {
    wx.navigateTo({
      url: `/pages/fault-report/fault-report?deviceId=${this.data.deviceInfo.device_id}&deviceName=${this.data.deviceInfo.device_name}`
    });
  },

  startMaintenance: function () {
    wx.showModal({
      title: '开始维护',
      content: `确定要开始对${this.data.deviceInfo.device_name}进行维护吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/fault-report/fault-report?deviceId=${this.data.deviceInfo.device_id}&deviceName=${this.data.deviceInfo.device_name}&type=maintenance`
          });
        }
      }
    });
  }
}) 
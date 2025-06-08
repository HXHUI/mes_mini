Page({
  data: {
    orderId: '',
    orderInfo: {
      id: 'WO20230001',
      deviceName: '注塑机A1',
      deviceId: 'DEV20230001',
      deviceLocation: '生产车间A区',
      faultType: '设备漏油',
      faultDesc: '设备油管接口处漏油，地面已有少量油渍，需要尽快处理。',
      urgency: 'high',
      status: 'pending',
      reporter: '张三',
      contactPhone: '13800138000',
      reportTime: '2023-06-05 10:30',
      faultImages: [
        '/images/sample/fault1.jpg',
        '/images/sample/fault2.jpg'
      ]
    }
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({
        orderId: options.id
      });
      this.loadOrderDetail(options.id);
    }
  },
  
  loadOrderDetail: function (orderId) {
    // 这里应该调用API获取工单详情
    // 使用模拟数据
    
    // 如果是其他工单ID，可以模拟不同状态的工单
    if (orderId === 'WO20230002') {
      this.setData({
        orderInfo: {
          id: 'WO20230002',
          deviceName: '注塑机B2',
          deviceId: 'DEV20230002',
          deviceLocation: '生产车间B区',
          faultType: '温度控制异常',
          faultDesc: '温度控制异常，无法达到设定温度，影响产品质量。',
          urgency: 'medium',
          status: 'processing',
          reporter: '李四',
          contactPhone: '13900139000',
          reportTime: '2023-06-04 14:20',
          faultImages: [
            '/images/sample/fault3.jpg'
          ],
          handler: '张工程师',
          handleTime: '2023-06-04 15:40',
          handleDesc: '初步判断为温控器故障，正在更换零件。'
        }
      });
    } else if (orderId === 'WO20230003') {
      this.setData({
        orderInfo: {
          id: 'WO20230003',
          deviceName: '包装机C1',
          deviceId: 'DEV20230003',
          deviceLocation: '包装车间',
          faultType: '电机噪音大',
          faultDesc: '设备电机运行时噪音明显增大，担心会影响设备寿命。',
          urgency: 'low',
          status: 'completed',
          reporter: '王五',
          contactPhone: '13700137000',
          reportTime: '2023-06-03 09:15',
          handler: '李维修',
          handleTime: '2023-06-03 10:30',
          handleDesc: '检查电机运行情况，发现轴承磨损。',
          completeTime: '2023-06-03 14:20',
          solutionDesc: '更换电机轴承，并对电机进行全面润滑保养，噪音问题已解决。',
          usedMaterials: '轴承*2，润滑油200ml'
        }
      });
    }
  },

  previewImage: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.orderInfo.faultImages
    });
  },

  handleOrder: function () {
    wx.showModal({
      title: '接单处理',
      content: `确定要接手工单 ${this.data.orderInfo.id} 吗？`,
      success: (res) => {
        if (res.confirm) {
          // 模拟接单处理
          const userInfo = wx.getStorageSync('userInfo') || { name: '张工程师' };
          
          this.setData({
            'orderInfo.status': 'processing',
            'orderInfo.handler': userInfo.name,
            'orderInfo.handleTime': this.formatTime(new Date())
          });
          
          wx.showToast({
            title: '接单成功',
            icon: 'success'
          });
        }
      }
    });
  },
  
  showHandleForm: function () {
    wx.showModal({
      title: '填写处理信息',
      content: '该功能尚未实现，敬请期待',
      showCancel: false
    });
  },
  
  completeOrder: function () {
    wx.showModal({
      title: '完成工单',
      content: `确定要完成工单 ${this.data.orderInfo.id} 吗？`,
      success: (res) => {
        if (res.confirm) {
          // 模拟完成工单
          this.setData({
            'orderInfo.status': 'completed',
            'orderInfo.completeTime': this.formatTime(new Date()),
            'orderInfo.solutionDesc': '已处理完成，设备恢复正常运行。'
          });
          
          wx.showToast({
            title: '工单已完成',
            icon: 'success'
          });
        }
      }
    });
  },
  
  viewDeviceDetail: function () {
    wx.navigateTo({
      url: `/pages/device-detail/device-detail?id=${this.data.orderInfo.deviceId}`
    });
  },
  
  formatTime: function (date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    
    return [year, month, day].map(this.formatNumber).join('-') + ' ' + [hour, minute].map(this.formatNumber).join(':');
  },
  
  formatNumber: function (n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
  }
}) 
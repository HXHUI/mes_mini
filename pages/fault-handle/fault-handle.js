Page({
  data: {
    active: 0,
    loading: false,
    pendingList: [],
    processingList: [],
    pendingPage: 1,
    processingPage: 1,
    pendingHasMore: true,
    processingHasMore: true,
    limit: 10
  },

  onLoad: function () {
    this.loadData()
  },

  onPullDownRefresh: function () {
    this.resetData()
    this.loadData(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom: function () {
    if (this.data.active === 0 && this.data.pendingHasMore) {
      this.loadPendingOrders()
    } else if (this.data.active === 1 && this.data.processingHasMore) {
      this.loadProcessingOrders()
    }
  },

  resetData: function () {
    this.setData({
      pendingList: [],
      processingList: [],
      pendingPage: 1,
      processingPage: 1,
      pendingHasMore: true,
      processingHasMore: true
    })
  },

  loadData: function (callback) {
    if (this.data.active === 0) {
      this.loadPendingOrders(callback)
    } else {
      this.loadProcessingOrders(callback)
    }
  },

  loadPendingOrders: function (callback) {
    if (this.data.loading || !this.data.pendingHasMore) {
      if (typeof callback === 'function') {
        callback()
      }
      return
    }

    this.setData({ loading: true })

    // 模拟获取待处理工单列表
    setTimeout(() => {
      const newOrders = this.generateMockOrders('pending')
      
      this.setData({
        pendingList: [...this.data.pendingList, ...newOrders],
        pendingPage: this.data.pendingPage + 1,
        pendingHasMore: newOrders.length === this.data.limit,
        loading: false
      })

      if (typeof callback === 'function') {
        callback()
      }
    }, 500)
  },

  loadProcessingOrders: function (callback) {
    if (this.data.loading || !this.data.processingHasMore) {
      if (typeof callback === 'function') {
        callback()
      }
      return
    }

    this.setData({ loading: true })

    // 模拟获取处理中工单列表
    setTimeout(() => {
      const newOrders = this.generateMockOrders('in_progress')
      
      this.setData({
        processingList: [...this.data.processingList, ...newOrders],
        processingPage: this.data.processingPage + 1,
        processingHasMore: newOrders.length === this.data.limit,
        loading: false
      })

      if (typeof callback === 'function') {
        callback()
      }
    }, 500)
  },

  generateMockOrders: function (status) {
    const page = status === 'pending' ? this.data.pendingPage : this.data.processingPage
    
    if (page > 2) {
      return []
    }

    const orders = []
    const devices = ['注塑机A1', '切割机B2', '包装机C3', '打包机D4', '焊接机E5']
    
    for (let i = 0; i < this.data.limit; i++) {
      const deviceName = devices[Math.floor(Math.random() * devices.length)]
      const urgencyLevels = ['low', 'medium', 'high']
      const urgency = urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)]
      
      orders.push({
        id: `${status}_${page}_${i}`,
        device_name: deviceName,
        device_id: `DEV_${Math.floor(Math.random() * 1000)}`,
        fault_desc: `${deviceName}出现${status === 'pending' ? '故障' : '异常'}，需要${status === 'pending' ? '处理' : '维修'}`,
        report_time: this.getRandomTime(),
        reporter: '张三',
        status: status,
        urgency: urgency
      })
    }
    
    return orders
  },
  
  getRandomTime: function () {
    const now = new Date()
    const randomDays = Math.floor(Math.random() * 7)
    const randomHours = Math.floor(Math.random() * 24)
    
    now.setDate(now.getDate() - randomDays)
    now.setHours(now.getHours() - randomHours)
    
    return now.toISOString().replace('T', ' ').substring(0, 16)
  },

  handleTabChange: function (e) {
    const active = e.detail.index
    this.setData({ active })
    
    if (active === 0 && this.data.pendingList.length === 0) {
      this.loadPendingOrders()
    } else if (active === 1 && this.data.processingList.length === 0) {
      this.loadProcessingOrders()
    }
  },

  viewDetail: function (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`
    })
  },

  handleOrder: function (e) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index
    
    wx.showModal({
      title: '确认接单',
      content: '是否确认处理此故障工单？',
      success: (res) => {
        if (res.confirm) {
          // 更新工单状态
          const pendingList = this.data.pendingList
          const order = pendingList[index]
          
          // 将工单从待处理移到处理中
          pendingList.splice(index, 1)
          order.status = 'in_progress'
          
          this.setData({
            pendingList,
            processingList: [order, ...this.data.processingList]
          })
          
          wx.showToast({
            title: '已接单',
            icon: 'success'
          })
        }
      }
    })
  },

  completeOrder: function (e) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index
    
    wx.navigateTo({
      url: `/pages/complete-order/complete-order?id=${id}&index=${index}`
    })
  }
}) 
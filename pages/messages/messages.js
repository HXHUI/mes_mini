Page({
  data: {
    messageList: [],
    loading: false,
    page: 1,
    limit: 10,
    hasMore: true
  },

  onLoad: function () {
    this.loadMessages()
  },
  
  onShow: function() {
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
  },

  onPullDownRefresh: function () {
    this.setData({
      messageList: [],
      page: 1,
      hasMore: true
    })
    this.loadMessages(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom: function () {
    if (this.data.hasMore) {
      this.loadMessages()
    }
  },

  loadMessages: function (callback) {
    if (this.data.loading || !this.data.hasMore) {
      if (typeof callback === 'function') {
        callback()
      }
      return
    }

    this.setData({
      loading: true
    })

    // 模拟获取消息列表
    setTimeout(() => {
      const newMessages = this.generateMockMessages()
      
      this.setData({
        messageList: [...this.data.messageList, ...newMessages],
        loading: false,
        page: this.data.page + 1,
        hasMore: newMessages.length === this.data.limit
      })

      if (typeof callback === 'function') {
        callback()
      }
    }, 500)
  },

  generateMockMessages: function () {
    if (this.data.page > 3) {
      return []
    }

    const messages = []
    const types = ['repair', 'notice', 'approval']
    const titles = [
      '设备维修通知', 
      '工单处理提醒', 
      '故障申报确认', 
      '维修完成通知',
      '维修待处理'
    ]
    
    for (let i = 0; i < this.data.limit; i++) {
      const type = types[Math.floor(Math.random() * types.length)]
      const title = titles[Math.floor(Math.random() * titles.length)]
      
      messages.push({
        id: `msg_${this.data.page}_${i}`,
        type: type,
        title: title,
        content: `这是一条${title}消息，请及时处理。`,
        read: Math.random() > 0.5,
        time: this.getRandomTime()
      })
    }
    
    return messages
  },
  
  getRandomTime: function () {
    const now = new Date()
    const randomDays = Math.floor(Math.random() * 7)
    const randomHours = Math.floor(Math.random() * 24)
    const randomMins = Math.floor(Math.random() * 60)
    
    now.setDate(now.getDate() - randomDays)
    now.setHours(now.getHours() - randomHours)
    now.setMinutes(now.getMinutes() - randomMins)
    
    return now.toISOString()
  },

  viewMessage: function (e) {
    const index = e.currentTarget.dataset.index
    const message = this.data.messageList[index]
    
    // 标记为已读
    const messageList = this.data.messageList
    messageList[index].read = true
    this.setData({
      messageList
    })
    
    // 跳转到相应页面或显示详情
    wx.showModal({
      title: message.title,
      content: message.content,
      showCancel: false
    })
  }
}) 
Page({
  data: {
    tabType: 'all',
    searchText: '',
    orderList: [],
    loading: false,
    hasMore: true,
    pageNum: 1,
    pageSize: 10
  },

  onLoad: function (options) {
    if (options.type) {
      this.setData({
        tabType: options.type
      });
    }
    this.loadOrderList(true);
  },
  
  onPullDownRefresh: function () {
    this.setData({
      pageNum: 1,
      hasMore: true
    });
    this.loadOrderList(true);
    wx.stopPullDownRefresh();
  },
  
  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreOrders();
    }
  },
  
  switchTab: function (e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      tabType: type,
      pageNum: 1,
      hasMore: true,
      orderList: []
    });
    this.loadOrderList(true);
  },
  
  onSearchInput: function (e) {
    this.setData({
      searchText: e.detail.value
    });
  },
  
  search: function () {
    this.setData({
      pageNum: 1,
      hasMore: true
    });
    this.loadOrderList(true);
  },
  
  showFilter: function () {
    wx.showToast({
      title: '筛选功能开发中',
      icon: 'none'
    });
  },
  
  loadOrderList: function (refresh = false) {
    if (this.data.loading) return;
    
    this.setData({
      loading: true
    });
    
    // 模拟API请求
    setTimeout(() => {
      // 模拟订单数据
      const mockData = this.getMockOrderList();
      
      this.setData({
        orderList: refresh ? mockData : [...this.data.orderList, ...mockData],
        loading: false,
        hasMore: mockData.length >= this.data.pageSize,
        pageNum: refresh ? 1 : this.data.pageNum + 1
      });
    }, 1000);
  },
  
  loadMoreOrders: function () {
    this.setData({
      pageNum: this.data.pageNum + 1
    });
    this.loadOrderList();
  },
  
  getMockOrderList: function () {
    // 根据tab类型和搜索条件过滤数据
    const { tabType, searchText } = this.data;
    
    const allOrders = [
      {
        id: 'WO20230001',
        deviceName: '注塑机A1',
        deviceId: 'DEV20230001',
        faultDesc: '设备漏油，需要检查管道',
        reportTime: '2023-06-05 10:30',
        reporter: '张三',
        status: 'pending',
        urgency: 'high'
      },
      {
        id: 'WO20230002',
        deviceName: '注塑机B2',
        deviceId: 'DEV20230002',
        faultDesc: '温度控制异常，无法达到设定温度',
        reportTime: '2023-06-04 14:20',
        reporter: '李四',
        status: 'processing',
        urgency: 'medium'
      },
      {
        id: 'WO20230003',
        deviceName: '包装机C1',
        deviceId: 'DEV20230003',
        faultDesc: '电机噪音大，需要检查',
        reportTime: '2023-06-03 09:15',
        reporter: '王五',
        status: 'completed',
        urgency: 'low'
      },
      {
        id: 'WO20230004',
        deviceName: '切割机D1',
        deviceId: 'DEV20230004',
        faultDesc: '刀片磨损严重，需要更换',
        reportTime: '2023-06-02 16:45',
        reporter: '赵六',
        status: 'pending',
        urgency: 'medium'
      },
      {
        id: 'WO20230005',
        deviceName: '注塑机A2',
        deviceId: 'DEV20230005',
        faultDesc: '控制面板故障，无法启动',
        reportTime: '2023-06-01 11:30',
        reporter: '孙七',
        status: 'processing',
        urgency: 'high'
      }
    ];
    
    let filteredOrders = allOrders;
    
    // 根据选项卡过滤
    if (tabType !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === tabType);
    }
    
    // 搜索过滤
    if (searchText) {
      const keyword = searchText.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.deviceName.toLowerCase().includes(keyword) || 
        order.id.toLowerCase().includes(keyword)
      );
    }
    
    return filteredOrders;
  },
  
  viewOrderDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`
    });
  },
  
  handleOrder: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '接单处理',
      content: `确定要接手工单 ${id} 吗？`,
      success: (res) => {
        if (res.confirm) {
          // 模拟接单处理
          let orderList = this.data.orderList;
          for (let i = 0; i < orderList.length; i++) {
            if (orderList[i].id === id) {
              orderList[i].status = 'processing';
              break;
            }
          }
          
          this.setData({
            orderList: orderList
          });
          
          wx.showToast({
            title: '接单成功',
            icon: 'success'
          });
        }
      }
    });
  },
  
  completeOrder: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '完成工单',
      content: `确定要完成工单 ${id} 吗？`,
      success: (res) => {
        if (res.confirm) {
          // 模拟完成工单
          let orderList = this.data.orderList;
          for (let i = 0; i < orderList.length; i++) {
            if (orderList[i].id === id) {
              orderList[i].status = 'completed';
              break;
            }
          }
          
          this.setData({
            orderList: orderList
          });
          
          wx.showToast({
            title: '工单已完成',
            icon: 'success'
          });
        }
      }
    });
  },
  
  viewDetail: function (e) {
    this.viewOrderDetail(e);
  }
}) 
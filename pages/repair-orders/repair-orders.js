// 引入API模块
import { repairApi } from '../../utils/api/repair.js';

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
    // 如果从首页点击统计数据跳转而来，根据状态参数设置选项卡
    if (options.status) {
      let tabType = 'all';
      
      // 状态映射
      if (options.status === 'pending') {
        tabType = 'pending';
      } else if (options.status === 'in_progress') {
        tabType = 'processing';
      } else if (options.status === 'completed') {
        tabType = 'completed';
      }
      
      this.setData({
        tabType: tabType
      });
    } else if (options.type) {
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
    
    // 获取对应状态的工单列表
    let apiMethod;
    switch (this.data.tabType) {
      case 'pending':
        apiMethod = repairApi.getPendingWorkOrders(this.data.pageNum, this.data.pageSize);
        break;
      case 'processing':
        apiMethod = repairApi.getProcessingWorkOrders(this.data.pageNum, this.data.pageSize);
        break;
      case 'completed':
        apiMethod = repairApi.getWorkOrderList('completed', this.data.pageNum, this.data.pageSize);
        break;
      default:
        apiMethod = repairApi.getWorkOrderList('', this.data.pageNum, this.data.pageSize);
    }
    
    apiMethod
      .then(res => {
        if (res && res.code === 200) {
          // 处理返回数据
          let newOrders = [];
          let total = 0;
          
          // 根据实际API返回格式处理数据
          if (res.data) {
            if (Array.isArray(res.data)) {
              // 如果直接返回数组
              newOrders = res.data;
              total = res.data.length + this.data.orderList.length + 10; // 假设还有更多
            } else if (res.data.list && Array.isArray(res.data.list)) {
              // 如果返回分页对象
              newOrders = res.data.list;
              total = res.data.total || 0;
            } else if (res.data.items && Array.isArray(res.data.items)) {
              // 如果返回分页对象（另一种格式）
              newOrders = res.data.items;
              total = res.data.total || 0;
            } else {
              // 单个对象的情况
              newOrders = [res.data];
              total = 1;
            }
          }
          
          this.setData({
            orderList: refresh ? newOrders : [...this.data.orderList, ...newOrders],
            loading: false,
            hasMore: newOrders.length >= this.data.pageSize,
            pageNum: refresh ? 1 : this.data.pageNum + 1
          });
        } else {
          this.setData({
            loading: false,
            hasMore: false
          });
          
          if (refresh) {
            // 如果API请求失败，使用模拟数据（仅在刷新时使用）
            const mockData = this.getMockOrderList();
            this.setData({
              orderList: mockData
            });
          }
        }
      })
      .catch(err => {
        console.error('获取工单列表失败', err);
        this.setData({
          loading: false,
          hasMore: false
        });
        
        if (refresh) {
          // 如果API请求失败，使用模拟数据（仅在刷新时使用）
          const mockData = this.getMockOrderList();
          this.setData({
            orderList: mockData
          });
        }
      });
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
    const userInfo = wx.getStorageSync('userInfo');
    
    if (!userInfo || !userInfo.id) {
      wx.showToast({
        title: '用户信息不完整，请重新登录',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '接单处理',
      content: `确定要接手工单 ${id} 吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...'
          });
          
          // 使用API方法调用接单处理接口
          repairApi.acceptWorkOrder(id, userInfo.id)
            .then(res => {
              wx.hideLoading();
              
              if (res && res.code === 200) {
                wx.showToast({
                  title: '接单成功',
                  icon: 'success'
                });
                
                // 更新本地列表数据
                const orderList = this.data.orderList.map(order => {
                  if (order.id === id) {
                    return {
                      ...order,
                      status: 'in_progress',
                      assigned_to: userInfo.id,
                      assigned_to_name: userInfo.real_name || userInfo.name
                    };
                  }
                  return order;
                });
                
                this.setData({ orderList });
                
                // 如果当前是"待处理"选项卡，可以从列表中移除该工单
                if (this.data.tabType === 'pending') {
                  setTimeout(() => {
                    this.setData({
                      orderList: this.data.orderList.filter(order => order.id !== id)
                    });
                  }, 500);
                }
              } else {
                const errMsg = res?.message || '接单失败';
                wx.showToast({
                  title: errMsg,
                  icon: 'none'
                });
              }
            })
            .catch(err => {
              wx.hideLoading();
              console.error('接单失败', err);
              
              wx.showToast({
                title: '接单失败，请检查网络连接',
                icon: 'none'
              });
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
});
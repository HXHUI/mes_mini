import { maintenanceApi } from '../../utils/api/maintenance.js';

Page({
  data: {
    orderList: [],
    tabType: 'all', // all, unassigned, pending, processing, completed, cancelled
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    searchText: '',
    assignedToMe: false  // 添加分配给我的状态
  },

  onLoad: function(options) {
    console.log('保养工单列表页接收到的参数:', options);
    
    // 处理"分配给我"参数
    if (options.filter_type === 'assigned_to_me' || options.type === 'my' || options.assigned_to) {
      this.setData({
        assignedToMe: true
      });
      
      console.log('设置分配给我筛选为true');
      
      // 确保用户信息完整
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || (!userInfo.id && !userInfo.user_id)) {
        wx.showToast({
          title: '用户信息不完整，请重新登录',
          icon: 'none',
          duration: 2000
        });
        return;
      }
    }
    
    // 处理不同类型的跳转
    if (options.status) {
      let tabType = 'all';
      
      // 状态映射
      if (options.status === 'unassigned') {
        tabType = 'unassigned';
      } else if (options.status === 'pending') {
        tabType = 'pending';
      } else if (options.status === 'in_progress') {
        tabType = 'processing';
      } else if (options.status === 'completed') {
        tabType = 'completed';
      } else if (options.status === 'cancelled') {
        tabType = 'cancelled';
      }
      
      this.setData({
        tabType: tabType
      });
    } else if (options.type && options.type !== 'my') {
      // 处理不同类型的跳转
        this.setData({
          tabType: options.type
        });
    }
    
    this.loadOrders();
  },

  onPullDownRefresh: function() {
    // 重置页码，刷新列表
    this.setData({
      page: 1,
      hasMore: true,
      orderList: []
    });
    
    this.loadOrders();
  },

  onReachBottom: function() {
    // 如果有更多数据且不在加载中状态，加载下一页
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreOrders();
    }
  },

  // 切换标签
  switchTab: function(e) {
    const type = e.currentTarget.dataset.type;
    
    if (type !== this.data.tabType) {
      this.setData({
        tabType: type,
        page: 1,
        hasMore: true,
        orderList: []
      });
      
      this.loadOrders();
    }
  },

  // 搜索输入
  onSearchInput: function(e) {
    this.setData({
      searchText: e.detail.value
    });
  },

  // 执行搜索
  search: function() {
    this.setData({
      page: 1,
      hasMore: true,
      orderList: []
    });
    
    this.loadOrders();
  },

  // 显示筛选
  showFilter: function() {
    wx.showToast({
      title: '筛选功能开发中',
      icon: 'none'
    });
  },

  // 处理"分配给我"复选框变化
  onAssignedToMeChange: function(e) {
    this.setData({
      assignedToMe: e.detail.value.length > 0,
      page: 1,
      orderList: []
    });
    this.loadOrders();
  },

  // 加载保养工单列表
  loadOrders: function() {
    this.setData({ loading: true });
    
    // 构建API请求参数
    const params = {
      type: 'MAINTENANCE',
      page: this.data.page,
      page_size: this.data.pageSize
    };
    
    // 根据选择的标签添加状态过滤
    if (this.data.tabType === 'unassigned') {
      params.status = 'unassigned';
    } else if (this.data.tabType === 'pending') {
      params.status = 'pending';
    } else if (this.data.tabType === 'processing') {
      params.status = 'in_progress';
    } else if (this.data.tabType === 'completed') {
      params.status = 'completed';
    } else if (this.data.tabType === 'accepted') {
      params.status = 'accepted';
    } else if (this.data.tabType === 'cancelled') {
      params.status = 'cancelled';
    }
    
    // 添加搜索关键词
    if (this.data.searchText && this.data.searchText.trim() !== '') {
      params.keyword = this.data.searchText.trim();
    }
    
    // 添加分配给我的筛选条件
    if (this.data.assignedToMe) {
      const userInfo = wx.getStorageSync('userInfo');
      console.log('当前用户信息:', userInfo);
      
      if (userInfo && userInfo.id) {
        params.assigned_to = userInfo.id;
        console.log('设置assigned_to参数为:', userInfo.id);
      } else {
        wx.showToast({
          title: '用户信息不完整，无法筛选',
          icon: 'none'
        });
      }
    }
    
    console.log('加载保养工单，参数:', params);
    
    // 调用API获取保养工单列表
    maintenanceApi.getMaintenanceOrders(params)
      .then(res => {
        wx.stopPullDownRefresh();
        
        // 处理200(OK)和304(Not Modified)响应
        if ((res && res.code === 200 && res.data) || res.statusCode === 304) {
          // 如果是304，res可能不包含数据，此时应该使用之前的数据
          let newOrders = [];
          let pagination = {};
          
          if (res.code === 200 && res.data) {
            newOrders = res.data.list || [];
            pagination = res.data.pagination || {};
          } else if (res.statusCode === 304) {
            // 304情况下保持现有数据
            console.log('304 Not Modified，使用缓存数据');
            newOrders = this.data.orderList;
            // 如果是第一页且目前有数据，则认为缓存有效
            if (this.data.page === 1 && this.data.orderList.length > 0) {
              this.setData({
                loading: false
              });
              return; // 直接返回，保持现有数据
            }
          }
          
          console.log('获取到的保养工单数据:', newOrders);
          
          // 处理工单数据，添加hasStarted字段
          newOrders = newOrders.map(order => ({
            ...order,
            hasStarted: !!order.actual_start // 根据actual_start字段判断工单是否已开始
          }));
          
          const total = pagination.total || 0;
          
          this.setData({
            orderList: newOrders,
            loading: false,
            hasMore: newOrders.length > 0 && this.data.page < Math.ceil(total / this.data.pageSize)
          });
        } else {
          this.setData({
            loading: false,
            hasMore: false
          });
          
          // 显示错误提示
          wx.showToast({
            title: '获取工单列表失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('获取工单列表失败：', err);
        wx.stopPullDownRefresh();
        
        this.setData({
          loading: false,
          hasMore: false
        });
        
        // 显示错误提示
        wx.showToast({
          title: '获取工单列表失败，请重试',
          icon: 'none'
        });
      });
  },

  // 加载更多工单
  loadMoreOrders: function() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({
      page: this.data.page + 1,
      loading: true
    });
    
    // 构建API请求参数
    const params = {
      type: 'MAINTENANCE',
      page: this.data.page,
      page_size: this.data.pageSize
    };
    
    // 根据选择的标签添加状态过滤
    if (this.data.tabType === 'unassigned') {
      params.status = 'unassigned';
    } else if (this.data.tabType === 'pending') {
      params.status = 'pending';
    } else if (this.data.tabType === 'processing') {
      params.status = 'in_progress';
    } else if (this.data.tabType === 'completed') {
      params.status = 'completed';
    } else if (this.data.tabType === 'cancelled') {
      params.status = 'cancelled';
    }
    
    // 添加搜索关键词
    if (this.data.searchText && this.data.searchText.trim() !== '') {
      params.keyword = this.data.searchText.trim();
    }
    
    // 添加分配给我的筛选条件
    if (this.data.assignedToMe) {
      const userInfo = wx.getStorageSync('userInfo');
      console.log('当前用户信息:', userInfo);
      
      if (userInfo && userInfo.id) {
        params.assigned_to = userInfo.id;
        console.log('设置assigned_to参数为:', userInfo.id);
      } else {
        wx.showToast({
          title: '用户信息不完整，无法筛选',
          icon: 'none'
        });
      }
    }
    
    console.log('加载更多保养工单，参数:', params);
    
    // 调用API获取更多工单
    maintenanceApi.getMaintenanceOrders(params)
      .then(res => {
        // 处理200(OK)和304(Not Modified)响应
        if ((res && res.code === 200 && res.data) || res.statusCode === 304) {
          let newOrders = [];
          let pagination = {};
          
          if (res.code === 200 && res.data) {
            newOrders = res.data.list || [];
            pagination = res.data.pagination || {};
          } else if (res.statusCode === 304) {
            // 304情况下，可能没有更多数据
            console.log('304 Not Modified，无更多数据');
            this.setData({
              loading: false,
              hasMore: false
            });
            return;
          }
          
          // 处理工单数据，添加hasStarted字段
          newOrders = newOrders.map(order => ({
            ...order,
            hasStarted: !!order.actual_start // 根据actual_start字段判断工单是否已开始
          }));
          
          // 获取分页信息
          const total = pagination.total || 0;
          
          this.setData({
            orderList: [...this.data.orderList, ...newOrders],
            loading: false,
            hasMore: newOrders.length > 0 && this.data.page < Math.ceil(total / this.data.pageSize)
          });
        } else {
          this.setData({
            loading: false,
            hasMore: false
          });
        }
      })
      .catch(err => {
        console.error('加载更多工单失败：', err);
        
        this.setData({
          loading: false
        });
        
        wx.showToast({
          title: '加载更多工单失败',
          icon: 'none'
        });
      });
  },

  // 查看工单详情
  viewOrderDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}&type=MAINTENANCE`
    });
  },

  // 接单处理
  handleOrder: function(e) {
    const id = e.currentTarget.dataset.id;
    
    // 获取当前登录用户信息
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
      content: '确定要接手该工单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '接单处理中...',
          });
          
          // 调用接单API，传递用户ID作为assigned_to参数
          maintenanceApi.acceptMaintenanceOrder(id, userInfo.id)
            .then(res => {
              wx.hideLoading();
              
              if (res && res.code === 200) {
                // 接单成功，更新工单状态
                const orderList = this.data.orderList.map(item => {
                  if (item.id === id) {
                    return {
                      ...item,
                      status: 'in_progress',
                      assigned_to: userInfo.id,
                      assigned_to_name: userInfo.real_name || userInfo.name || userInfo.nickname
                    };
                  }
                  return item;
                });
                
                this.setData({ orderList });
                
                // 显示成功提示
                wx.showToast({
                  title: '接单成功',
                  icon: 'success'
                });
                
                // 跳转到工单详情页
                setTimeout(() => {
                  wx.navigateTo({
                    url: `/pages/order-detail/order-detail?id=${id}&type=MAINTENANCE`
                  });
                }, 1000);
              } else {
                // 接单失败
                wx.showToast({
                  title: res?.message || '接单失败，请重试',
                  icon: 'none'
                });
              }
            })
            .catch(err => {
              wx.hideLoading();
              console.error('接单失败：', err);
              
              wx.showToast({
                title: '接单失败，请重试',
                icon: 'none'
              });
            });
        }
      }
    });
  },

  // 查看详情
  viewDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}&type=MAINTENANCE`
    });
  }
}); 
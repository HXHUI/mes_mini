// 引入API模块
import { repairApi } from '../../utils/api/repair.js';
import { userApi } from '../../utils/api/user.js';

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
    limit: 10,
    userInfo: null
  },

  onLoad: function () {
    // 获取用户信息
    this.getUserInfo();
    this.loadData();
  },

  onPullDownRefresh: function () {
    this.resetData();
    this.loadData(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function () {
    if (this.data.active === 0 && this.data.pendingHasMore) {
      this.loadPendingOrders();
    } else if (this.data.active === 1 && this.data.processingHasMore) {
      this.loadProcessingOrders();
    }
  },

  getUserInfo: function() {
    // 尝试从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
      return;
    }

    // 如果本地没有，从服务器获取
    userApi.getUserInfo()
      .then(res => {
        if (res.data) {
          this.setData({ userInfo: res.data });
          wx.setStorageSync('userInfo', res.data);
        }
      })
      .catch(err => {
        console.error('获取用户信息失败', err);
      });
  },

  resetData: function () {
    this.setData({
      pendingList: [],
      processingList: [],
      pendingPage: 1,
      processingPage: 1,
      pendingHasMore: true,
      processingHasMore: true
    });
  },

  loadData: function (callback) {
    if (this.data.active === 0) {
      this.loadPendingOrders(callback);
    } else {
      this.loadProcessingOrders(callback);
    }
  },

  // 处理API返回的数据，格式化显示信息
  formatWorkOrderData: function(order) {
    // 确保对象字段存在，避免undefined错误
    if (!order) return null;
    
    // 创建工单对象副本，避免修改原始数据
    const formattedOrder = {...order};
    
    // 格式化创建时间
    if (formattedOrder.created_at) {
      const date = new Date(formattedOrder.created_at);
      if (!isNaN(date.getTime())) {
        formattedOrder.created_at = date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(/\//g, '-');
      }
    }
    
    return formattedOrder;
  },

  loadPendingOrders: function (callback) {
    if (this.data.loading || !this.data.pendingHasMore) {
      if (typeof callback === 'function') {
        callback();
      }
      return;
    }

    this.setData({ loading: true });

    // 使用API获取待处理工单列表
    repairApi.getPendingWorkOrders(this.data.pendingPage, this.data.limit)
      .then(res => {
        if (res && res.code === 200) {
          // 检查返回数据结构
          let newOrders = [];
          let total = 0;
          
          // 根据实际API返回格式处理数据
          if (res.data) {
            if (Array.isArray(res.data)) {
              // 如果直接返回数组
              newOrders = res.data.map(this.formatWorkOrderData);
              total = res.data.length + this.data.pendingList.length + 10; // 假设还有更多
            } else if (res.data.list && Array.isArray(res.data.list)) {
              // 如果返回分页对象
              newOrders = res.data.list.map(this.formatWorkOrderData);
              total = res.data.total || 0;
            } else if (res.data.items && Array.isArray(res.data.items)) {
              // 如果返回分页对象（另一种格式）
              newOrders = res.data.items.map(this.formatWorkOrderData);
              total = res.data.total || 0;
            } else {
              // 单个对象的情况
              newOrders = [this.formatWorkOrderData(res.data)];
              total = 1;
            }
          }
          
          console.log('获取到待处理工单数:', newOrders.length);
          
          this.setData({
            pendingList: [...this.data.pendingList, ...newOrders.filter(item => item !== null)],
            pendingPage: this.data.pendingPage + 1,
            pendingHasMore: this.data.pendingList.length + newOrders.length < total,
            loading: false
          });
        } else {
          this.setData({ loading: false, pendingHasMore: false });
        }

        if (typeof callback === 'function') {
          callback();
        }
      })
      .catch(err => {
        console.error('获取待处理工单失败', err);
        this.setData({ loading: false });
        
        wx.showToast({
          title: '获取工单失败，请重试',
          icon: 'none'
        });
        
        if (typeof callback === 'function') {
          callback();
        }
      });
  },

  loadProcessingOrders: function (callback) {
    if (this.data.loading || !this.data.processingHasMore) {
      if (typeof callback === 'function') {
        callback();
      }
      return;
    }

    this.setData({ loading: true });

    // 使用API获取处理中工单列表
    repairApi.getProcessingWorkOrders(this.data.processingPage, this.data.limit)
      .then(res => {
        if (res && res.code === 200) {
          // 检查返回数据结构
          let newOrders = [];
          let total = 0;
          
          // 根据实际API返回格式处理数据
          if (res.data) {
            if (Array.isArray(res.data)) {
              // 如果直接返回数组
              newOrders = res.data.map(this.formatWorkOrderData);
              total = res.data.length + this.data.processingList.length + 10; // 假设还有更多
            } else if (res.data.list && Array.isArray(res.data.list)) {
              // 如果返回分页对象
              newOrders = res.data.list.map(this.formatWorkOrderData);
              total = res.data.total || 0;
            } else if (res.data.items && Array.isArray(res.data.items)) {
              // 如果返回分页对象（另一种格式）
              newOrders = res.data.items.map(this.formatWorkOrderData);
              total = res.data.total || 0;
            } else {
              // 单个对象的情况
              newOrders = [this.formatWorkOrderData(res.data)];
              total = 1;
            }
          }
          
          console.log('获取到处理中工单数:', newOrders.length);
          
          this.setData({
            processingList: [...this.data.processingList, ...newOrders.filter(item => item !== null)],
            processingPage: this.data.processingPage + 1,
            processingHasMore: this.data.processingList.length + newOrders.length < total,
            loading: false
          });
        } else {
          this.setData({ loading: false, processingHasMore: false });
        }

        if (typeof callback === 'function') {
          callback();
        }
      })
      .catch(err => {
        console.error('获取处理中工单失败', err);
        this.setData({ loading: false });
        
        wx.showToast({
          title: '获取工单失败，请重试',
          icon: 'none'
        });
        
        if (typeof callback === 'function') {
          callback();
        }
      });
  },

  handleTabChange: function (e) {
    const index = parseInt(e.currentTarget.dataset.index);
    if (this.data.active !== index) {
      this.setData({ active: index });
      
      if (index === 0 && this.data.pendingList.length === 0) {
        this.loadPendingOrders();
      } else if (index === 1 && this.data.processingList.length === 0) {
        this.loadProcessingOrders();
      }
    }
  },

  viewDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`
    });
  },

  handleOrder: function (e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    
    wx.showModal({
      title: '确认接单',
      content: '确定接受该工单并开始处理？',
      success: (res) => {
        if (res.confirm) {
          this.takeOrder(id, index);
        }
      }
    });
  },
  
  takeOrder: function(orderId, index) {
    wx.showLoading({
      title: '正在接单...',
    });
    
    // 检查是否有用户信息
    if (!this.data.userInfo || !this.data.userInfo.id) {
      wx.hideLoading();
      wx.showToast({
        title: '获取用户信息失败，请重新登录',
        icon: 'none'
      });
      return;
    }
    
    // 调用接单处理API
    wx.request({
      url: getApp().globalData.baseUrl + `/api/device-work-order/${orderId}/accept`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + wx.getStorageSync('token')
      },
      data: {
        id: orderId,
        assigned_to: this.data.userInfo.id,
        status: 'in_progress'
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          wx.showToast({
            title: '接单成功',
            icon: 'success'
          });
          
          // 将工单从待处理列表移到处理中列表
          const order = this.data.pendingList[index];
          const updatedOrder = {
            ...order,
            status: 'in_progress', // 状态改为in_progress
            assigned_to: this.data.userInfo.id,
            assigned_to_name: this.data.userInfo.real_name || this.data.userInfo.name || '维修人员'
          };
          
          const pendingList = [...this.data.pendingList];
          pendingList.splice(index, 1);
          
          this.setData({
            pendingList,
            processingList: [updatedOrder, ...this.data.processingList]
          });
        } else {
          const errMsg = res.data?.message || '接单失败';
          wx.showToast({
            title: errMsg,
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('接单失败', err);
        
        wx.showToast({
          title: '接单失败，请检查网络连接',
          icon: 'none'
        });
      }
    });
  },
  
  completeOrder: function (e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    
    wx.navigateTo({
      url: `/pages/order-complete/order-complete?id=${id}&index=${index}`
    });
  }
}) 
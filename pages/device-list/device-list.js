// 引入API模块
import { deviceApi } from '../../utils/api.js';

Page({
  data: {
    deviceList: [],
    categories: [
      { text: '生产设备', value: 'production' },
      { text: '检测设备', value: 'testing' },
      { text: '办公设备', value: 'office' },
      { text: '其他设备', value: 'other' }
    ],
    currentCategoryIndex: -1, // -1表示全部
    keyword: '',
    isLoading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    isSelectMode: false // 是否是选择模式
  },

  onLoad: function (options) {
    // 判断是否是选择模式
    if (options.mode === 'select') {
      this.setData({
        isSelectMode: true
      });
    }
    
    // 加载设备列表
    this.loadDeviceList();
  },
  
  onPullDownRefresh: function () {
    // 下拉刷新
    this.resetList();
    wx.stopPullDownRefresh();
  },
  
  onReachBottom: function () {
    // 上拉加载更多
    if (this.data.hasMore && !this.data.isLoading) {
      this.loadDeviceList(true);
    }
  },
  
  // 重置列表，用于刷新
  resetList: function () {
    this.setData({
      deviceList: [],
      page: 1,
      hasMore: true
    });
    this.loadDeviceList();
  },
  
  // 加载设备列表
  loadDeviceList: function (loadMore = false) {
    if (this.data.isLoading || (!loadMore && !this.data.hasMore)) {
      return;
    }
    
    this.setData({
      isLoading: true
    });
    
    const params = {
      page: this.data.page,
      pageSize: this.data.pageSize,
      keyword: this.data.keyword
    };
    
    // 添加分类过滤
    if (this.data.currentCategoryIndex !== -1) {
      params.device_type = this.data.categories[this.data.currentCategoryIndex].value;
    }
    
    deviceApi.getDeviceList(params)
      .then(res => {
        if (res && res.code === 200 && res.data) {
          const newList = loadMore 
            ? [...this.data.deviceList, ...res.data.list] 
            : res.data.list;
            
          this.setData({
            deviceList: newList,
            hasMore: res.data.total_pages > res.data.page,
            page: loadMore ? this.data.page + 1 : 1
          });
        } else {
          wx.showToast({
            title: '获取设备列表失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('获取设备列表失败:', err);
        wx.showToast({
          title: '获取设备列表失败',
          icon: 'none'
        });
        
        // 使用模拟数据用于演示
        this.setMockData(loadMore);
      })
      .finally(() => {
        this.setData({
          isLoading: false
        });
      });
  },
  
  // 设置模拟数据（演示用）
  setMockData: function (loadMore) {
    const mockDevices = [
      {
        id: 79,
        device_id: "rq45",
        device_name: "柔曲45",
        device_type: "production",
        department: null,
        location: null,
        status: "active",
        created_at: "2025-05-07 21:36:46",
        updated_at: "2025-05-07 21:39:24"
      },
      {
        id: 80,
        device_id: "Z0011",
        device_name: "1#浸渍定型烘干机",
        device_type: "production",
        department: null,
        location: null,
        status: "active"
      },
      {
        id: 81,
        device_id: "Z0018",
        device_name: "4#裹胶",
        device_type: "production",
        department: null,
        location: null,
        status: "active"
      },
      {
        id: 82,
        device_id: "ZDPLDL_1DB",
        device_name: "自动配料1号电柜",
        device_type: "testing",
        department: null,
        location: null,
        status: "active"
      },
      {
        id: 83,
        device_id: "Z0007",
        device_name: "2#精炼",
        device_type: "office",
        department: null,
        location: null,
        status: "active"
      }
    ];
    
    // 根据关键词过滤
    let filteredDevices = mockDevices;
    
    if (this.data.keyword) {
      const keyword = this.data.keyword.toLowerCase();
      filteredDevices = mockDevices.filter(device => 
        device.device_name.toLowerCase().includes(keyword) || 
        device.device_id.toLowerCase().includes(keyword)
      );
    }
    
    // 根据分类过滤
    if (this.data.currentCategoryIndex !== -1) {
      const categoryValue = this.data.categories[this.data.currentCategoryIndex].value;
      filteredDevices = filteredDevices.filter(device => 
        device.device_type === categoryValue
      );
    }
    
    const newList = loadMore 
      ? [...this.data.deviceList, ...filteredDevices]
      : filteredDevices;
    
    this.setData({
      deviceList: newList,
      hasMore: false,
      page: loadMore ? this.data.page + 1 : 1
    });
  },
  
  // 搜索关键词输入
  onKeywordInput: function (e) {
    this.setData({
      keyword: e.detail.value
    });
  },
  
  // 清除关键词
  clearKeyword: function () {
    this.setData({
      keyword: ''
    });
    this.resetList();
  },
  
  // 搜索设备
  searchDevices: function () {
    this.resetList();
  },
  
  // 切换分类
  switchCategory: function (e) {
    const index = parseInt(e.currentTarget.dataset.index);
    if (index !== this.data.currentCategoryIndex) {
      this.setData({
        currentCategoryIndex: index
      });
      this.resetList();
    }
  },
  
  // 选择设备
  onDeviceSelect: function (e) {
    const device = e.currentTarget.dataset.device;
    
    if (this.data.isSelectMode) {
      // 选择模式下，返回选中的设备信息
      wx.navigateTo({
        url: `/pages/fault-report/fault-report?deviceId=${device.device_id}`
      });
    } else {
      // 非选择模式下，跳转到设备详情
      wx.navigateTo({
        url: `/pages/device-detail/device-detail?id=${device.device_id}`
      });
    }
  }
}) 
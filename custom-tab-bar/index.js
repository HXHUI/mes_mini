Component({
  data: {
    selected: 0,
    color: "#999999",
    selectedColor: "#4285f4",
    list: [{
      pagePath: "/pages/index/index",
      text: "首页",
      iconClass: "icon-home",
      selectedIconClass: "icon-home-fill"
    }, {
      pagePath: "/pages/profile/profile",
      text: "我的",
      iconClass: "icon-user",
      selectedIconClass: "icon-user-fill"
    }]
  },
  attached() {
    // 默认选中第一个选项卡
    this.setData({
      selected: 0
    });
    
    // 尝试获取当前页面信息
    try {
      const selected = this.getTabBarIndex();
      this.setData({
        selected
      });
    } catch (error) {
      console.error('获取TabBar索引失败:', error);
    }
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({
        url
      })
      this.setData({
        selected: data.index
      })
    },
    getTabBarIndex() {
      const pages = getCurrentPages();
      if (!pages || pages.length === 0) {
        return 0;
      }
      
      const currentPage = pages[pages.length - 1];
      if (!currentPage || !currentPage.route) {
        return 0;
      }
      
      const route = currentPage.route;
      const tabList = this.data.list;
      let index = 0;
      
      for (let i = 0; i < tabList.length; i++) {
        if (tabList[i].pagePath === `/${route}`) {
          index = i;
          break;
        }
      }
      
      return index;
    }
  }
}) 
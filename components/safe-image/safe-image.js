Component({
  /**
   * 组件的属性列表
   */
  properties: {
    src: {
      type: String,
      value: '',
      observer: function(newVal) {
        if (newVal) {
          this.loadImage(newVal);
        }
      }
    },
    mode: {
      type: String,
      value: 'aspectFill'
    },
    width: {
      type: String,
      value: '100%'
    },
    height: {
      type: String,
      value: 'auto'
    },
    radius: {
      type: String,
      value: '0'
    },
    showError: {
      type: Boolean,
      value: true
    },
    fallbackSrc: {
      type: String,
      value: '/images/image-error.png'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    localSrc: '',
    loading: false,
    error: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    loadImage: function(url) {
      if (!url) return;
      
      // 如果是本地临时文件或者本地资源，直接使用
      if (url.startsWith('wxfile://') || url.startsWith('http://tmp/')) {
        this.setData({ localSrc: url, loading: false, error: false });
        return;
      }
      
      this.setData({ loading: true, error: false });
      
      const app = getApp();
      // 获取当前环境配置
      const baseUrl = app.globalData.baseUrl || '';
      const staticUrl = app.globalData.staticUrl || '';
      const isDev = app.globalData.isDev || false;
      
      // 处理URL格式，确保是完整URL
      let fullUrl = url;
      
      // 如果已经是完整URL，直接使用
      if (url.startsWith('http')) {
        fullUrl = url;
      } 
      // 处理相对路径
      else {
        // 处理图片路径
        if (url.includes('uploads')) {
          // 如果是上传的图片
          if (!url.startsWith('/mes/')) {
            // 不包含/mes前缀，添加它
            fullUrl = staticUrl + '/mes' + (url.startsWith('/') ? '' : '/') + url;
          } else {
            // 已包含/mes前缀
            fullUrl = staticUrl + url;
          }
        } else {
          // 其他API资源
          fullUrl = baseUrl + (url.startsWith('/') ? '' : '/') + url;
        }
      }
      
      console.log(`图片组件: 下载图片 [${isDev ? '开发环境' : '生产环境'}]`, fullUrl);
      
      // 添加随机参数，避免缓存问题
      const timestamp = new Date().getTime();
      const finalUrl = fullUrl.includes('?') ? `${fullUrl}&t=${timestamp}` : `${fullUrl}?t=${timestamp}`;
      
      wx.downloadFile({
        url: finalUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            console.log('图片组件: 下载成功', res.tempFilePath);
            this.setData({
              localSrc: res.tempFilePath,
              loading: false,
              error: false
            });
          } else {
            console.error('图片组件: 下载失败', res.statusCode, finalUrl);
            this.setData({
              loading: false,
              error: true
            });
            this.triggerEvent('error', { url: url, statusCode: res.statusCode });
          }
        },
        fail: (err) => {
          console.error('图片组件: 下载错误', err, finalUrl);
          this.setData({
            loading: false,
            error: true
          });
          this.triggerEvent('error', { url: url, error: err });
        }
      });
    },
    
    handleTap: function() {
      if (this.data.error || !this.data.localSrc) return;
      
      this.triggerEvent('tap', { src: this.data.localSrc });
    },
    
    handleImageError: function() {
      this.setData({
        error: true,
        loading: false
      });
      this.triggerEvent('error', { url: this.properties.src });
    }
  },
  
  lifetimes: {
    attached: function() {
      if (this.properties.src) {
        this.loadImage(this.properties.src);
      }
    }
  }
}) 
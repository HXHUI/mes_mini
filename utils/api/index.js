// utils/api/index.js
import { deviceApi } from './device.js'
import { repairApi } from './repair.js'
import { userApi } from './user.js'
import { maintenanceApi } from './maintenance.js'
import { deviceWorkOrderApi } from './device-work-order.js'

// 微信小程序配置
export const wxConfig = {
  // 是否为开发环境
  isDev: true,
  
  templateIds: {
    // 设备维修工单通知模板ID
    repairOrderNotice: '9jeM1crRhs2GZd4XWTauA4yQQRwNDEctoYwmBkuIXy0' // 请替换为实际申请的模板ID
  },
  
  // 检查是否应该请求订阅
  shouldRequestSubscription: function() {
    // 检查是否已订阅
    const hasSubscribed = wx.getStorageSync('subscribed_repair_notice');
    if (hasSubscribed) return false;
    
    // 检查是否最近拒绝过订阅
    const declinedTime = wx.getStorageSync('subscription_declined');
    if (declinedTime) {
      // 如果在24小时内拒绝过，不再请求
      const now = new Date().getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (now - declinedTime < oneDayMs) {
        // 检查用户是否通过设置打开了订阅消息权限
        // 这里主动检查一次订阅消息权限状态
        return new Promise((resolve) => {
          wx.getSetting({
            withSubscriptions: true,
            success: (res) => {
              console.log('获取订阅消息权限状态:', res);
              // 检查是否有订阅消息的权限信息
              if (res.subscriptionsSetting && 
                  res.subscriptionsSetting.mainSwitch &&
                  res.subscriptionsSetting.itemSettings) {
                const templateId = this.templateIds.repairOrderNotice;
                // 如果用户在设置中打开了该模板的订阅权限，允许再次请求
                if (res.subscriptionsSetting.itemSettings[templateId] === 'accept') {
                  console.log('用户在设置中已接受订阅，允许再次请求');
                  // 清除拒绝记录
                  wx.removeStorageSync('subscription_declined');
                  resolve(true);
                  return;
                }
              }
              resolve(false);
            },
            fail: (err) => {
              console.error('获取订阅消息设置失败:', err);
              resolve(false);
            }
          });
        });
      }
    }
    
    return true;
  }
};

export {
  deviceApi,
  repairApi,
  userApi,
  maintenanceApi,
  deviceWorkOrderApi
} 
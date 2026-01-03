// pages/my/my.js
import { isLoggedIn, logout } from '../../utils/auth.js';
import { userApi } from '../../utils/api.js';

const app = getApp();

Page({
  data: {
    userInfo: null
  },

  onLoad(options) {
    console.log('个人中心加载', options);
  },

  onShow() {
    // 每次显示都刷新用户信息
    this.loadUserInfo();
  },

  /**
   * 加载用户信息
   */
  async loadUserInfo() {
    if (!isLoggedIn()) {
      this.setData({ userInfo: null });
      return;
    }

    try {
      // 从全局数据获取
      const userInfo = app.globalData.userInfo;

      // 如果全局数据有，直接使用
      if (userInfo) {
        this.setData({ userInfo });
      }

      // 从云端获取最新数据
      const userData = await userApi.getUserProfile(app.globalData.openid);
      this.setData({ userInfo: userData });
      app.globalData.userInfo = userData;
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  /**
   * 跳转到登录页
   */
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  /**
   * 退出登录
   */
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout();
          this.setData({ userInfo: null });
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  }
});

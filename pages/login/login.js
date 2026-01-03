// pages/login/login.js
import { login } from '../../utils/auth.js';

const app = getApp();

Page({
  data: {
    loading: false
  },

  onLoad(options) {
    console.log('登录页加载', options);

    // 如果已登录，直接返回
    if (app.globalData.userInfo && app.globalData.openid) {
      this.backToLastPage();
    }
  },

  /**
   * 登录
   */
  async onLogin() {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });

      // 执行登录流程
      const { openid, userInfo } = await login();

      console.log('登录成功', { openid, userInfo });

      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      });

      // 延迟返回，让用户看到成功提示
      setTimeout(() => {
        this.backToLastPage();
      }, 1500);
    } catch (error) {
      console.error('登录失败:', error);

      this.setData({ loading: false });

      // 如果用户拒绝授权
      if (error.errMsg && error.errMsg.includes('auth deny')) {
        wx.showModal({
          title: '需要授权',
          content: '需要您的授权才能使用完整功能，是否重新授权？',
          success: (res) => {
            if (res.confirm) {
              this.onLogin();
            }
          }
        });
      } else {
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
      }
    }
  },

  /**
   * 返回上一页
   */
  backToLastPage() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  /**
   * 查看用户协议
   */
  goToUserAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/agreement?type=user'
    });
  },

  /**
   * 查看隐私政策
   */
  goToPrivacyPolicy() {
    wx.navigateTo({
      url: '/pages/agreement/agreement?type=privacy'
    });
  }
});

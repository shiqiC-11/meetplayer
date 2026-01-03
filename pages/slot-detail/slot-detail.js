// pages/slot-detail/slot-detail.js
import { slotApi, applicationApi } from '../../utils/api.js';
import { checkAndGuideLogin } from '../../utils/auth.js';
import { formatDateTime, formatDistance } from '../../utils/geo.js';

const app = getApp();

Page({
  data: {
    slotId: '',
    slot: null,
    loading: true,
    applying: false,
    applicationMessage: '',

    // 是否是主办人
    isHost: false,

    // 当前用户的申请状态
    hasApplied: false,
    myApplication: null
  },

  onLoad(options) {
    console.log('Slot 详情页加载', options);

    if (!options.id) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({ slotId: options.id });
    this.loadSlotDetail();
  },

  onShow() {
    // 每次显示都刷新数据
    if (this.data.slotId) {
      this.loadSlotDetail();
    }
  },

  /**
   * 加载约球局详情
   */
  async loadSlotDetail() {
    try {
      this.setData({ loading: true });

      const slot = await slotApi.getSlotDetail(this.data.slotId);

      // 格式化数据
      slot.formattedDatetime = formatDateTime(slot.datetime);
      slot.formattedDuration = `${slot.duration / 60}小时`;

      // 计算距离（如果有用户位置）
      const userLocation = app.globalData.location;
      if (userLocation && slot.venue && slot.venue.location) {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          slot.venue.location.coordinates[1],
          slot.venue.location.coordinates[0]
        );
        slot.formattedDistance = formatDistance(distance);
      }

      // 检查是否是主办人
      const openid = app.globalData.openid;
      const isHost = openid === slot._openid;

      this.setData({
        slot,
        isHost,
        hasApplied: slot.hasApplied || false,
        myApplication: slot.myApplication || null,
        loading: false
      });

    } catch (error) {
      this.setData({ loading: false });
      console.error('加载约球局详情失败:', error);

      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 申请加入
   */
  async onApply() {
    // 检查登录状态
    const isLoggedIn = await checkAndGuideLogin();
    if (!isLoggedIn) {
      return;
    }

    // 显示申请留言输入框
    wx.showModal({
      title: '申请加入',
      content: '请输入申请留言（选填）',
      editable: true,
      placeholderText: '向主办人介绍一下自己吧',
      success: (res) => {
        if (res.confirm) {
          this.submitApplication(res.content || '');
        }
      }
    });
  },

  /**
   * 提交申请
   */
  async submitApplication(message) {
    if (this.data.applying) return;

    try {
      this.setData({ applying: true });
      wx.showLoading({ title: '提交中...' });

      await applicationApi.applySlot(this.data.slotId, message);

      wx.hideLoading();
      this.setData({ applying: false });

      wx.showToast({
        title: '申请已提交',
        icon: 'success'
      });

      // 重新加载详情
      setTimeout(() => {
        this.loadSlotDetail();
      }, 1500);

    } catch (error) {
      wx.hideLoading();
      this.setData({ applying: false });

      console.error('申请失败:', error);
      wx.showToast({
        title: error.message || '申请失败',
        icon: 'none'
      });
    }
  },

  /**
   * 取消申请
   */
  cancelApplication() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消申请吗？',
      success: (res) => {
        if (res.confirm) {
          // TODO: 调用取消申请云函数
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 拨打电话（联系主办人）
   */
  callHost() {
    const { slot } = this.data;

    if (!slot.host || !slot.host.phone) {
      wx.showToast({
        title: '主办人未提供电话',
        icon: 'none'
      });
      return;
    }

    wx.makePhoneCall({
      phoneNumber: slot.host.phone
    });
  },

  /**
   * 查看球场详情
   */
  goToVenueDetail() {
    const { slot } = this.data;
    wx.navigateTo({
      url: `/pages/venue-detail/venue-detail?id=${slot.venueId}`
    });
  },

  /**
   * 查看用户详情
   */
  goToUserDetail(e) {
    const { userId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/user-detail/user-detail?id=${userId}`
    });
  },

  /**
   * 管理申请（主办人）
   */
  manageApplications() {
    const { slot } = this.data;

    if (!slot.applications || slot.applications.length === 0) {
      wx.showToast({
        title: '暂无申请',
        icon: 'none'
      });
      return;
    }

    // 显示申请列表
    const actions = slot.applications.map(app => {
      return `${app.applicant.nickName} - ${app.status === 'pending' ? '待审核' : app.status === 'approved' ? '已通过' : '已拒绝'}`;
    });

    wx.showActionSheet({
      itemList: actions,
      success: (res) => {
        const application = slot.applications[res.tapIndex];
        this.showApplicationDetail(application);
      }
    });
  },

  /**
   * 显示申请详情
   */
  showApplicationDetail(application) {
    const actions = ['通过', '拒绝'];

    wx.showActionSheet({
      itemList: actions,
      success: (res) => {
        if (res.tapIndex === 0) {
          this.approveApplication(application._id);
        } else if (res.tapIndex === 1) {
          this.rejectApplication(application._id);
        }
      }
    });
  },

  /**
   * 通过申请
   */
  async approveApplication(applicationId) {
    try {
      wx.showLoading({ title: '处理中...' });

      await applicationApi.respondApplication(applicationId, 'approve', '');

      wx.hideLoading();
      wx.showToast({
        title: '已通过申请',
        icon: 'success'
      });

      // 重新加载详情
      setTimeout(() => {
        this.loadSlotDetail();
      }, 1500);

    } catch (error) {
      wx.hideLoading();
      console.error('处理申请失败:', error);
      wx.showToast({
        title: error.message || '处理失败',
        icon: 'none'
      });
    }
  },

  /**
   * 拒绝申请
   */
  async rejectApplication(applicationId) {
    wx.showModal({
      title: '拒绝申请',
      content: '请输入拒绝原因（选填）',
      editable: true,
      placeholderText: '告诉对方拒绝的原因',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中...' });

            await applicationApi.respondApplication(
              applicationId,
              'reject',
              res.content || '抱歉，本次不太合适'
            );

            wx.hideLoading();
            wx.showToast({
              title: '已拒绝申请',
              icon: 'success'
            });

            // 重新加载详情
            setTimeout(() => {
              this.loadSlotDetail();
            }, 1500);

          } catch (error) {
            wx.hideLoading();
            console.error('处理申请失败:', error);
            wx.showToast({
              title: error.message || '处理失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  /**
   * 取消约球局（主办人）
   */
  cancelSlot() {
    wx.showModal({
      title: '确认取消',
      content: '取消后将通知所有参与者，确定要取消吗？',
      confirmText: '确定取消',
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          // TODO: 调用取消约球局云函数
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    const { slot } = this.data;

    return {
      title: `${slot.venue.name} - ${slot.formattedDatetime}`,
      path: `/pages/slot-detail/slot-detail?id=${slot._id}`,
      imageUrl: slot.venue.photos && slot.venue.photos[0] || '/assets/images/default-venue.png'
    };
  },

  /**
   * 计算距离（简化版）
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
});

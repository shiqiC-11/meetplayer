// pages/my-slots/my-slots.js
import { slotApi } from '../../utils/api.js';
import { formatDateTime, formatDistance } from '../../utils/geo.js';

const app = getApp();

Page({
  data: {
    activeTab: 'created',
    createdSlots: [],
    joinedSlots: [],
    loading: false
  },

  onLoad(options) {
    console.log('我的约球页加载', options);
    this.loadSlots();
  },

  onShow() {
    // 每次显示都刷新数据
    this.loadSlots();
  },

  /**
   * 加载约球数据
   */
  async loadSlots() {
    try {
      this.setData({ loading: true });

      // 并行加载我创建的和我参加的
      const [createdSlots, joinedSlots] = await Promise.all([
        slotApi.getMySlots('created'),
        slotApi.getMySlots('joined')
      ]);

      // 处理数据
      this.processSlots(createdSlots, 'createdSlots');
      this.processSlots(joinedSlots, 'joinedSlots');

      this.setData({ loading: false });

    } catch (error) {
      this.setData({ loading: false });
      console.error('加载约球失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  /**
   * 处理约球数据
   */
  processSlots(slots, dataKey) {
    const userLocation = app.globalData.location;

    const processedSlots = slots.map(slot => {
      // 格式化时间
      slot.formattedDatetime = formatDateTime(slot.datetime);
      slot.formattedDuration = `${slot.duration / 60}小时`;

      // 计算距离
      if (userLocation && slot.venue && slot.venue.location) {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          slot.venue.location.coordinates[1],
          slot.venue.location.coordinates[0]
        );
        slot.formattedDistance = formatDistance(distance);
      }

      // 格式化状态
      slot.statusText = this.getStatusText(slot.status);
      slot.statusColor = this.getStatusColor(slot.status);

      // 格式化需求
      slot.requirementText = {
        level: slot.requirement.simpleLevel.join('、'),
        gender: ['不限', '仅男', '仅女'][slot.requirement.gender] || '不限'
      };

      // 计算还需人数
      slot.needCount = slot.requirement.needCount - slot.currentCount;

      return slot;
    });

    this.setData({ [dataKey]: processedSlots });
  },

  /**
   * 获取状态文本
   */
  getStatusText(status) {
    const statusMap = {
      'open': '招募中',
      'full': '已满员',
      'cancelled': '已取消',
      'completed': '已完成',
      'expired': '已过期'
    };
    return statusMap[status] || status;
  },

  /**
   * 获取状态颜色
   */
  getStatusColor(status) {
    const colorMap = {
      'open': '#07c160',
      'full': '#ff976a',
      'cancelled': '#ee0a24',
      'completed': '#969799',
      'expired': '#969799'
    };
    return colorMap[status] || '#969799';
  },

  /**
   * 切换 Tab
   */
  onTabChange(e) {
    this.setData({ activeTab: e.detail.name });
  },

  /**
   * 查看约球详情
   */
  viewSlotDetail(e) {
    const { slotId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/slot-detail/slot-detail?id=${slotId}`
    });
  },

  /**
   * 再次发布约球
   */
  republishSlot(e) {
    const { slot } = e.currentTarget.dataset;

    // 将约球信息存储到全局数据，供发布页使用
    const app = getApp();
    app.globalData.republishData = {
      venueId: slot.venueId,
      venue: slot.venue,
      duration: slot.duration,
      requirement: slot.requirement,
      cost: slot.cost,
      description: slot.description
    };

    // 跳转到发布页
    wx.navigateTo({
      url: '/pages/publish/publish?mode=republish'
    });
  },

  /**
   * 取消约球（仅主办人）
   */
  cancelSlot(e) {
    const { slotId } = e.currentTarget.dataset;

    wx.showModal({
      title: '确认取消',
      content: '取消后将通知所有参与者，确定要取消吗？',
      editable: true,
      placeholderText: '请输入取消原因',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '取消中...' });

            await slotApi.cancelSlot(slotId, res.content || '临时有事，抱歉取消');

            wx.hideLoading();
            wx.showToast({
              title: '已取消约球',
              icon: 'success'
            });

            // 重新加载数据
            setTimeout(() => {
              this.loadSlots();
            }, 1500);

          } catch (error) {
            wx.hideLoading();
            console.error('取消失败:', error);
            wx.showToast({
              title: error.message || '取消失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  /**
   * 计算距离
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

// pages/venue-detail/venue-detail.js
import { venueApi } from '../../utils/api.js';
import { formatDateTime, formatDistance } from '../../utils/geo.js';

const app = getApp();

Page({
  data: {
    venueId: '',
    venue: null,
    loading: true,
    currentPhotoIndex: 0
  },

  onLoad(options) {
    console.log('球场详情页加载', options);

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

    this.setData({ venueId: options.id });
    this.loadVenueDetail();
  },

  /**
   * 加载球场详情
   */
  async loadVenueDetail() {
    try {
      this.setData({ loading: true });

      const venue = await venueApi.getVenueDetail(this.data.venueId);

      // 处理即将进行的约球局
      if (venue.upcomingSlots && venue.upcomingSlots.length > 0) {
        const userLocation = app.globalData.location;

        venue.upcomingSlots = venue.upcomingSlots.map(slot => {
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

          // 格式化需求
          slot.requirementText = {
            level: slot.requirement.simpleLevel.join('、'),
            gender: ['不限', '仅男', '仅女'][slot.requirement.gender] || '不限'
          };

          // 计算还需人数
          slot.needCount = slot.requirement.needCount - slot.currentCount;

          return slot;
        });
      }

      // 格式化地址
      if (venue.address) {
        venue.formattedAddress = `${venue.address.city}${venue.address.district}${venue.address.detail}`;
      }

      // 格式化球场数
      if (venue.courts) {
        venue.courtsText = `${venue.courts.total}片${venue.courts.indoor ? '室内' : '室外'}${venue.courts.surface}`;
      }

      this.setData({
        venue,
        loading: false
      });

    } catch (error) {
      this.setData({ loading: false });
      console.error('加载球场详情失败:', error);

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
   * 查看约球详情
   */
  viewSlotDetail(e) {
    const { slotId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/slot-detail/slot-detail?id=${slotId}`
    });
  },

  /**
   * 在地图中查看位置
   */
  openLocation() {
    const { venue } = this.data;

    if (!venue || !venue.location) {
      wx.showToast({
        title: '位置信息不可用',
        icon: 'none'
      });
      return;
    }

    wx.openLocation({
      latitude: venue.location.coordinates[1],
      longitude: venue.location.coordinates[0],
      name: venue.name,
      address: venue.formattedAddress || '',
      scale: 18
    });
  },

  /**
   * 拨打电话
   */
  makePhoneCall() {
    const { venue } = this.data;

    if (!venue.contact || !venue.contact.phone) {
      wx.showToast({
        title: '暂无联系电话',
        icon: 'none'
      });
      return;
    }

    wx.makePhoneCall({
      phoneNumber: venue.contact.phone
    });
  },

  /**
   * 照片滑动
   */
  onPhotoChange(e) {
    this.setData({
      currentPhotoIndex: e.detail.current
    });
  },

  /**
   * 预览图片
   */
  previewPhoto(e) {
    const { url } = e.currentTarget.dataset;
    const { venue } = this.data;

    if (!venue.photos || venue.photos.length === 0) {
      return;
    }

    wx.previewImage({
      current: url,
      urls: venue.photos
    });
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    const { venue } = this.data;

    return {
      title: `${venue.name} - ${venue.courtsText}`,
      path: `/pages/venue-detail/venue-detail?id=${venue._id}`,
      imageUrl: venue.photos && venue.photos[0] || '/assets/images/default-venue.png'
    };
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

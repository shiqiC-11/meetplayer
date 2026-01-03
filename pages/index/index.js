// pages/index/index.js
import { getCurrentLocation, formatDistance } from '../../utils/geo.js';
import { venueApi, slotApi } from '../../utils/api.js';
import { DEFAULT_MAP_CENTER, MAP_SCALE } from '../../utils/constants.js';

const app = getApp();

Page({
  data: {
    viewMode: 'map', // 'map' | 'list'
    searchKeyword: '',

    // 地图相关
    mapCenter: DEFAULT_MAP_CENTER,
    mapScale: MAP_SCALE,
    markers: [],
    selectedVenue: null,

    // 列表相关
    slots: [],
    loading: false,
    hasMore: true,
    page: 1,

    // 筛选相关
    showFilter: false,
    filters: {
      time: 'all',
      distance: 5000,
      levels: [],
      gender: '0'
    },

    // 位置信息
    userLocation: null,

    // 标志位：是否已初始化
    initialized: false
  },

  onLoad(options) {
    console.log('首页加载', options);
    this.init();
  },

  onShow() {
    // 只在已初始化后才刷新数据,避免地图不断移动
    if (this.data.initialized) {
      this.loadData(); // 直接加载数据,不重置位置
    }
  },

  onPullDownRefresh() {
    this.refreshData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 初始化
   */
  async init() {
    try {
      // 获取用户位置
      await this.getUserLocation();

      // 加载数据
      await this.loadData();

      // 标记为已初始化
      this.setData({ initialized: true });
    } catch (error) {
      console.error('初始化失败:', error);
      this.setData({ initialized: true }); // 即使失败也标记为已初始化
    }
  },

  /**
   * 获取用户位置
   */
  async getUserLocation() {
    try {
      const location = await getCurrentLocation();

      // 验证位置数据有效性
      if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        throw new Error('位置数据无效');
      }

      // 只在首次获取位置时更新地图中心,避免地图不断移动
      const updateData = { userLocation: location };
      if (!this.data.userLocation) {
        updateData.mapCenter = {
          latitude: location.latitude,
          longitude: location.longitude
        };
      }

      this.setData(updateData);
      app.globalData.location = location;
    } catch (error) {
      console.error('获取位置失败:', error);

      // 使用默认位置
      if (!this.data.userLocation) {
        this.setData({
          userLocation: DEFAULT_MAP_CENTER,
          mapCenter: DEFAULT_MAP_CENTER
        });
      }

      wx.showToast({
        title: '定位失败，使用默认位置',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 加载数据
   */
  async loadData() {
    if (this.data.viewMode === 'map') {
      await this.loadVenues();
    } else {
      await this.loadSlots();
    }
  },

  /**
   * 加载球场（地图模式）
   */
  async loadVenues() {
    try {
      wx.showLoading({ title: '加载中...' });

      let { userLocation, filters } = this.data;

      // 如果没有位置信息,先获取
      if (!userLocation) {
        try {
          await this.getUserLocation();
          userLocation = this.data.userLocation;
        } catch (error) {
          console.error('获取位置失败:', error);
        }
      }

      // 如果还是没有位置,使用默认位置或提示用户
      if (!userLocation) {
        wx.hideLoading();
        wx.showToast({
          title: '无法获取位置,请授权位置权限',
          icon: 'none',
          duration: 3000
        });
        return;
      }

      const params = {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        radius: filters.distance
      };

      const venues = await venueApi.getNearbyVenues(params);

      // 转换为地图标记
      const markers = venues.map((venue, index) => ({
        id: index,
        latitude: venue.location.coordinates[1],
        longitude: venue.location.coordinates[0],
        iconPath: '/assets/icons/venue-marker.jpg',
        width: 40,
        height: 40,
        callout: {
          content: `${venue.name} (${venue.openSlotsCount || 0})`,
          padding: 10,
          borderRadius: 5,
          display: 'BYCLICK'
        },
        venueData: venue
      }));

      this.setData({ markers });
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      console.error('加载球场失败:', error);
    }
  },

  /**
   * 加载约球局（列表模式）
   */
  async loadSlots(append = false) {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });

      let { userLocation, filters, page } = this.data;

      // 如果没有位置信息,先获取
      if (!userLocation) {
        try {
          await this.getUserLocation();
          userLocation = this.data.userLocation;
        } catch (error) {
          console.error('获取位置失败:', error);
        }
      }

      // 如果还是没有位置,提示用户
      if (!userLocation) {
        this.setData({ loading: false });
        wx.showToast({
          title: '无法获取位置,请授权位置权限',
          icon: 'none',
          duration: 3000
        });
        return;
      }

      const params = {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        radius: filters.distance,
        filters: {
          simpleLevel: filters.levels,  // 传递简化等级数组
          gender: parseInt(filters.gender)  // 传递性别（数字）
        }
      };

      const newSlots = await slotApi.getNearbySlots(params);

      // 处理 slot 数据：计算距离、格式化显示文本
      newSlots.forEach(slot => {
        // 计算距离
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          slot.venue.location.coordinates[1],
          slot.venue.location.coordinates[0]
        );
        slot.distance = formatDistance(distance);

        // 格式化时间
        slot.dateTimeText = this.formatDateTime(slot.datetime);

        // 格式化费用信息
        if (slot.cost && slot.cost.type !== 'free') {
          slot.paymentInfo = {
            type: slot.cost.type,
            perPersonAmount: slot.cost.perPerson,
            totalCount: slot.requirement.needCount,
            paidCount: 0,  // TODO: 后续实现支付功能后更新
            paid: false
          };
        }

        // 格式化要求文本
        slot.requirementText = {
          level: slot.requirement.simpleLevel.join('、'),
          gender: ['不限', '仅男', '仅女'][slot.requirement.gender] || '不限'
        };

        // 计算还缺人数
        slot.needCount = slot.requirement.needCount - slot.currentCount;

        // 备注
        slot.note = slot.description;

        // 状态文本
        slot.statusText = slot.status === 'open' ? '约球中' : '已结束';
      });

      this.setData({
        slots: append ? [...this.data.slots, ...newSlots] : newSlots,
        loading: false,
        hasMore: newSlots.length >= 20,
        page: append ? page + 1 : 2
      });
    } catch (error) {
      this.setData({ loading: false });
      console.error('加载约球局失败:', error);
    }
  },

  /**
   * 刷新数据
   */
  async refreshData() {
    this.setData({
      page: 1,
      slots: [],
      markers: []
    });
    await this.loadData();
  },

  /**
   * 加载更多
   */
  loadMore() {
    if (this.data.viewMode === 'list' && this.data.hasMore && !this.data.loading) {
      this.loadSlots(true);
    }
  },

  /**
   * 切换视图模式
   */
  toggleViewMode() {
    const newMode = this.data.viewMode === 'map' ? 'list' : 'map';
    this.setData({ viewMode: newMode });
    this.loadData();
  },

  /**
   * 地图标记点击
   */
  onMarkerTap(e) {
    const { markerId } = e.detail;
    const marker = this.data.markers[markerId];

    if (marker) {
      const venue = marker.venueData;
      this.setData({
        selectedVenue: {
          ...venue,
          distance: formatDistance(
            this.calculateDistance(
              this.data.userLocation.latitude,
              this.data.userLocation.longitude,
              venue.location.coordinates[1],
              venue.location.coordinates[0]
            )
          )
        }
      });
    }
  },

  /**
   * 重新定位 (用户主动点击定位按钮)
   */
  async relocate() {
    try {
      wx.showLoading({ title: '定位中...' });

      // 获取最新位置
      const location = await getCurrentLocation();

      // 验证位置数据有效性
      if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        throw new Error('位置数据无效');
      }

      // 强制更新地图中心和用户位置
      this.setData({
        userLocation: location,
        mapCenter: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      });

      app.globalData.location = location;

      // 重新加载数据
      await this.loadData();

      wx.hideLoading();
      wx.showToast({
        title: '定位成功',
        icon: 'success',
        duration: 1500
      });
    } catch (error) {
      wx.hideLoading();
      console.error('重新定位失败:', error);
      wx.showToast({
        title: '定位失败，请检查位置权限',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 搜索框变化
   */
  onSearchChange(e) {
    this.setData({ searchKeyword: e.detail });
  },

  /**
   * 搜索
   */
  onSearch() {
    // TODO: 实现搜索功能
    console.log('搜索:', this.data.searchKeyword);
  },

  /**
   * 显示筛选弹窗
   */
  showFilterPopup() {
    this.setData({ showFilter: true });
  },

  /**
   * 关闭筛选弹窗
   */
  closeFilterPopup() {
    this.setData({ showFilter: false });
  },

  /**
   * 重置筛选
   */
  resetFilters() {
    this.setData({
      filters: {
        time: 'all',
        distance: 5000,
        levels: [],
        gender: '0'
      }
    });
  },

  /**
   * 应用筛选
   */
  applyFilters() {
    this.setData({ showFilter: false });
    this.refreshData();
  },

  /**
   * 时间筛选变化
   */
  onTimeChange(e) {
    this.setData({
      'filters.time': e.detail
    });
  },

  /**
   * 距离筛选变化
   */
  onDistanceChange(e) {
    this.setData({
      'filters.distance': parseInt(e.detail)
    });
  },

  /**
   * 等级筛选变化
   */
  onLevelsChange(e) {
    this.setData({
      'filters.levels': e.detail
    });
  },

  /**
   * 性别筛选变化
   */
  onGenderChange(e) {
    this.setData({
      'filters.gender': e.detail
    });
  },

  /**
   * 跳转到发布页
   */
  goToPublish() {
    wx.navigateTo({
      url: '/pages/publish/publish'
    });
  },

  /**
   * 跳转到球场详情
   */
  goToVenueDetail() {
    const { selectedVenue } = this.data;
    if (selectedVenue) {
      wx.navigateTo({
        url: `/pages/venue-detail/venue-detail?id=${selectedVenue._id}`
      });
    }
  },

  /**
   * 跳转到 Slot 详情
   */
  goToSlotDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/slot-detail/slot-detail?id=${id}`
    });
  },

  /**
   * 计算距离（简化版，实际使用 geo.js 中的函数）
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
  },

  /**
   * 格式化日期时间
   */
  formatDateTime(datetime) {
    const date = new Date(datetime);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hour}:${minute}`;

    if (date >= today && date < tomorrow) {
      return `今天 ${timeStr}`;
    } else if (date >= tomorrow && date < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
      return `明天 ${timeStr}`;
    } else {
      return `${month}-${day} ${timeStr}`;
    }
  }
});

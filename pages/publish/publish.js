// pages/publish/publish.js
import { slotApi, venueApi } from '../../utils/api.js';
import { checkAndGuideLogin } from '../../utils/auth.js';
import { LEVELS, GENDER_OPTIONS } from '../../utils/constants.js';

const app = getApp();

Page({
  data: {
    // 步骤
    currentStep: 0, // 0: 选择球场, 1: 填写详情

    // 球场选择
    selectedVenue: null,
    searchKeyword: '',
    nearbyVenues: [],
    searchResults: [],
    displayVenues: [],  // 当前显示的球场列表

    // 约球局信息
    formData: {
      sport: '网球',
      datetime: '',
      date: '',
      time: '',
      duration: 120,
      requirement: {
        simpleLevel: ['中级'],  // 数组
        ntrpRange: null,
        gender: 0,  // 0=不限 1=男 2=女
        needCount: 2  // 还需要人数
      },
      cost: {
        type: 'free',  // free/aa/partial
        total: 0,
        hostPays: 0
      },
      description: ''
    },

    // 选项
    levels: LEVELS,
    genders: GENDER_OPTIONS,
    costTypes: [
      { value: 'free', label: '免费' },
      { value: 'aa', label: 'AA 分摊' },
      { value: 'host', label: '部分承担' }
    ],
    costTypeLabel: '免费',  // 当前费用类型标签
    showLevelPopup: false,  // 显示等级选择弹窗

    // 状态
    loading: false,
    submitting: false
  },

  onLoad(options) {
    console.log('发布页加载', options);

    // 检查登录状态
    this.checkLogin();

    // 检查是否是再次发布模式
    if (options.mode === 'republish' && app.globalData.republishData) {
      this.handleRepublish();
    } else {
      // 加载附近球场
      this.loadNearbyVenues();
    }
  },

  /**
   * 处理再次发布
   */
  handleRepublish() {
    const data = app.globalData.republishData;

    // 预填充表单数据
    this.setData({
      selectedVenue: data.venue,
      currentStep: 1,  // 直接进入第二步
      'formData.duration': data.duration,
      'formData.requirement': data.requirement,
      'formData.cost': data.cost,
      'formData.description': data.description
    });

    // 更新费用类型标签
    const costType = this.data.costTypes.find(t => t.value === data.cost.type);
    if (costType) {
      this.setData({ costTypeLabel: costType.label });
    }

    // 清除全局数据
    delete app.globalData.republishData;

    wx.showToast({
      title: '已预填充上次信息',
      icon: 'success',
      duration: 2000
    });
  },

  /**
   * 检查登录状态
   */
  async checkLogin() {
    const isLoggedIn = await checkAndGuideLogin();
    if (!isLoggedIn) {
      wx.navigateBack();
    }
  },

  /**
   * 加载附近球场
   */
  async loadNearbyVenues() {
    try {
      const userLocation = app.globalData.location;

      if (!userLocation) {
        wx.showToast({
          title: '请先获取位置权限',
          icon: 'none'
        });
        return;
      }

      const venues = await venueApi.getNearbyVenues({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        radius: 10000 // 10km
      });

      this.setData({
        nearbyVenues: venues,
        displayVenues: venues
      });
    } catch (error) {
      console.error('加载球场失败:', error);
    }
  },

  /**
   * 选择球场
   */
  selectVenue(e) {
    const { venue } = e.currentTarget.dataset;
    this.setData({
      selectedVenue: venue,
      currentStep: 1
    });
  },

  /**
   * 使用微信地图选择位置创建新球场
   */
  async chooseLocation() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.chooseLocation({
          success: resolve,
          fail: reject
        });
      });

      const { name, address, latitude, longitude } = res;

      // 创建新球场（使用新数据模型）
      wx.showLoading({ title: '创建球场中...' });

      const newVenue = await venueApi.createVenue({
        name,
        lat: latitude,
        lng: longitude,
        address: {
          province: '',
          city: '',
          district: '',
          detail: address || ''
        },
        courts: {
          total: 1,
          indoor: false,
          lighting: true,
          surface: '硬地'
        }
      });

      wx.hideLoading();

      this.setData({
        selectedVenue: newVenue,
        currentStep: 1
      });

      wx.showToast({
        title: '球场创建成功',
        icon: 'success'
      });
    } catch (error) {
      wx.hideLoading();
      console.error('选择位置或创建球场失败:', error);

      if (error.errMsg && error.errMsg.includes('cancel')) {
        // 用户取消，不显示错误
        return;
      }

      wx.showToast({
        title: '创建球场失败',
        icon: 'none'
      });
    }
  },

  /**
   * 搜索球场
   */
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });

    if (!keyword) {
      this.setData({
        searchResults: [],
        displayVenues: this.data.nearbyVenues
      });
      return;
    }

    // 简单的本地搜索
    const results = this.data.nearbyVenues.filter(venue => {
      const address = venue.address.detail || venue.address.city || '';
      return venue.name.includes(keyword) || address.includes(keyword);
    });

    this.setData({
      searchResults: results,
      displayVenues: results
    });
  },

  /**
   * 返回上一步
   */
  prevStep() {
    this.setData({ currentStep: 0 });
  },

  /**
   * 日期选择
   */
  onDateChange(e) {
    this.setData({
      'formData.date': e.detail.value
    });
    this.updateDatetime();
  },

  /**
   * 时间选择
   */
  onTimeChange(e) {
    this.setData({
      'formData.time': e.detail.value
    });
    this.updateDatetime();
  },

  /**
   * 更新日期时间
   */
  updateDatetime() {
    const { date, time } = this.data.formData;
    if (date && time) {
      this.setData({
        'formData.datetime': `${date} ${time}:00`
      });
    }
  },

  /**
   * 时长选择
   */
  onDurationChange(e) {
    this.setData({
      'formData.duration': parseInt(e.detail.value)
    });
  },

  /**
   * 显示等级选择弹窗
   */
  showLevelPicker() {
    this.setData({ showLevelPopup: true });
  },

  /**
   * 关闭等级选择弹窗
   */
  closeLevelPicker() {
    this.setData({ showLevelPopup: false });
  },

  /**
   * 切换等级选项
   */
  toggleLevel(e) {
    const { name } = e.currentTarget.dataset;
    const currentLevels = this.data.formData.requirement.simpleLevel;
    const index = currentLevels.indexOf(name);

    if (index > -1) {
      // 已选中，取消选中
      currentLevels.splice(index, 1);
    } else {
      // 未选中，添加选中
      currentLevels.push(name);
    }

    this.setData({
      'formData.requirement.simpleLevel': currentLevels
    });
  },

  /**
   * 等级选择变化（checkbox-group）
   */
  onLevelChange(e) {
    this.setData({
      'formData.requirement.simpleLevel': e.detail
    });
  },

  /**
   * 确认等级选择
   */
  confirmLevelPicker() {
    this.closeLevelPicker();
  },

  /**
   * 人数选择（还需要人数）
   */
  onNeedCountChange(e) {
    this.setData({
      'formData.requirement.needCount': parseInt(e.detail.value)
    });
  },

  /**
   * 性别选择
   */
  onGenderChange(e) {
    const genderValue = parseInt(e.detail.value);
    this.setData({
      'formData.requirement.gender': genderValue
    });
  },

  /**
   * 费用类型选择
   */
  onCostTypeChange(e) {
    const costType = this.data.costTypes[e.detail.value];
    this.setData({
      'formData.cost.type': costType.value,
      costTypeLabel: costType.label
    });
  },

  /**
   * 总费用输入
   */
  onTotalCostInput(e) {
    this.setData({
      'formData.cost.total': parseFloat(e.detail.value) || 0
    });
  },

  /**
   * 主办人承担输入
   */
  onHostPaysInput(e) {
    this.setData({
      'formData.cost.hostPays': parseFloat(e.detail.value) || 0
    });
  },

  /**
   * 描述输入
   */
  onDescriptionInput(e) {
    this.setData({
      'formData.description': e.detail.value
    });
  },

  /**
   * 提交发布
   */
  async onSubmit() {
    if (this.data.submitting) return;

    try {
      // 验证表单
      if (!this.validateForm()) {
        return;
      }

      this.setData({ submitting: true });
      wx.showLoading({ title: '发布中...' });

      const { selectedVenue, formData } = this.data;

      // 调用创建 Slot 云函数（使用新数据模型）
      const slot = await slotApi.createSlot({
        sport: formData.sport,
        venueId: selectedVenue._id,
        datetime: formData.datetime,
        duration: formData.duration,
        requirement: formData.requirement,
        cost: formData.cost,
        description: formData.description
      });

      wx.hideLoading();
      this.setData({ submitting: false });

      wx.showToast({
        title: '发布成功',
        icon: 'success',
        duration: 2000
      });

      // 延迟跳转到详情页
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/slot-detail/slot-detail?id=${slot._id}`
        });
      }, 2000);

    } catch (error) {
      wx.hideLoading();
      this.setData({ submitting: false });

      console.error('发布失败:', error);
      wx.showToast({
        title: error.message || '发布失败',
        icon: 'none'
      });
    }
  },

  /**
   * 验证表单
   */
  validateForm() {
    const { datetime, date, time } = this.data.formData;

    if (!date || !time) {
      wx.showToast({
        title: '请选择日期和时间',
        icon: 'none'
      });
      return false;
    }

    // 验证时间不能是过去
    const slotDate = new Date(datetime);
    if (slotDate <= new Date()) {
      wx.showToast({
        title: '约球时间不能早于当前时间',
        icon: 'none'
      });
      return false;
    }

    return true;
  }
});

// api.js - API 封装

const db = wx.cloud.database();
const _ = db.command;

/**
 * 调用云函数
 * @param {string} name - 云函数名称
 * @param {object} data - 参数
 * @returns {Promise}
 */
export function callCloudFunction(name, data = {}) {
  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '加载中...' });

    wx.cloud.callFunction({
      name,
      data,
      success: (res) => {
        wx.hideLoading();
        if (res.result.success) {
          resolve(res.result.data);
        } else {
          wx.showToast({
            title: res.result.message || '操作失败',
            icon: 'none'
          });
          reject(new Error(res.result.message));
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error(`云函数 ${name} 调用失败:`, err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

/**
 * 用户相关 API
 */
export const userApi = {
  /**
   * 登录
   */
  async login() {
    return callCloudFunction('login');
  },

  /**
   * 获取用户信息
   * @param {string} userId
   */
  async getUserProfile(userId) {
    return callCloudFunction('getUserProfile', { userId });
  },

  /**
   * 更新用户信息
   * @param {object} userInfo
   */
  async updateUserProfile(userInfo) {
    return callCloudFunction('updateUserProfile', { userInfo });
  }
};

/**
 * Slot 相关 API
 */
export const slotApi = {
  /**
   * 创建 Slot
   * @param {object} params - { sport, venueId, datetime, duration, requirement, cost, description }
   */
  async createSlot(params) {
    return callCloudFunction('createSlot', params);
  },

  /**
   * 获取附近的 Slots
   * @param {object} params - { lat, lng, filters }
   */
  async getNearbySlots(params) {
    return callCloudFunction('getNearbySlots', params);
  },

  /**
   * 获取 Slot 详情
   * @param {string} slotId
   */
  async getSlotDetail(slotId) {
    return callCloudFunction('getSlotDetail', { slotId });
  },

  /**
   * 获取我的 Slots
   * @param {string} type - 'created' | 'joined'
   */
  async getMySlots(type) {
    return callCloudFunction('getMySlots', { type });
  },

  /**
   * 取消 Slot
   * @param {string} slotId
   * @param {string} reason
   */
  async cancelSlot(slotId, reason) {
    return callCloudFunction('cancelSlot', { slotId, reason });
  }
};

/**
 * 申请相关 API
 */
export const applicationApi = {
  /**
   * 申请加入 Slot
   * @param {string} slotId
   * @param {string} message
   */
  async applySlot(slotId, message) {
    return callCloudFunction('applySlot', { slotId, message });
  },

  /**
   * 审核申请
   * @param {string} applicationId
   * @param {string} action - 'approve' | 'reject'
   * @param {string} reason
   */
  async respondApplication(applicationId, action, reason) {
    return callCloudFunction('respondApplication', {
      applicationId,
      action,
      reason
    });
  },

  /**
   * 获取申请列表
   * @param {string} slotId
   */
  async getApplications(slotId) {
    return callCloudFunction('getApplications', { slotId });
  }
};

/**
 * 球场相关 API
 */
export const venueApi = {
  /**
   * 搜索球场
   * @param {object} params - { keyword, lat, lng, radius }
   */
  async searchVenues(params) {
    return callCloudFunction('searchVenues', params);
  },

  /**
   * 获取球场详情
   * @param {string} venueId
   */
  async getVenueDetail(venueId) {
    return callCloudFunction('getVenueDetail', { venueId });
  },

  /**
   * 创建球场
   * @param {object} params - { name, lat, lng, address, courts, facilities, pricing, contact, photos }
   */
  async createVenue(params) {
    return callCloudFunction('createVenue', params);
  },

  /**
   * 获取球场的 Slots
   * @param {string} venueId
   * @param {object} filters
   */
  async getVenueSlots(venueId, filters) {
    return callCloudFunction('getVenueSlots', { venueId, filters });
  },

  /**
   * 获取附近球场（带 Slots 数量）
   * @param {object} params - { lat, lng, radius }
   */
  async getNearbyVenues(params) {
    console.log("params", params)
    return callCloudFunction('getNearbyVenues', params);
  }
};

/**
 * 评价相关 API
 */
export const reviewApi = {
  /**
   * 提交用户评价
   * @param {object} reviewData - { slotId, toUserId, rating, tags, comment }
   */
  async submitReview(reviewData) {
    return callCloudFunction('submitReview', { reviewData });
  },

  /**
   * 提交球场评价
   * @param {object} reviewData
   */
  async submitVenueReview(reviewData) {
    return callCloudFunction('submitVenueReview', { reviewData });
  },

  /**
   * 获取用户评价
   * @param {string} userId
   */
  async getUserReviews(userId) {
    return callCloudFunction('getUserReviews', { userId });
  },

  /**
   * 获取球场评价
   * @param {string} venueId
   */
  async getVenueReviews(venueId) {
    return callCloudFunction('getVenueReviews', { venueId });
  }
};

/**
 * 上传文件
 * @param {string} filePath - 本地文件路径
 * @param {string} cloudPath - 云端路径
 * @returns {Promise<string>} 文件 URL
 */
export function uploadFile(filePath, cloudPath) {
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => {
        resolve(res.fileID);
      },
      fail: (err) => {
        console.error('文件上传失败:', err);
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

/**
 * 上传图片
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export async function uploadImage(filePath) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const cloudPath = `images/${timestamp}_${random}.jpg`;
  return uploadFile(filePath, cloudPath);
}

export default {
  userApi,
  slotApi,
  applicationApi,
  venueApi,
  reviewApi,
  uploadFile,
  uploadImage
};

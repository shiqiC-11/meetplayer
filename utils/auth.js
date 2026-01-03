// auth.js - 鉴权相关工具函数

const app = getApp();

/**
 * 检查用户是否已登录
 * @returns {boolean}
 */
export function isLoggedIn() {
  return !!app.globalData.openid && !!app.globalData.userInfo;
}

/**
 * 获取 openid
 * @returns {Promise<string>}
 */
export async function getOpenid() {
  if (app.globalData.openid) {
    return app.globalData.openid;
  }

  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'login',
      success: (res) => {
        if (res.result.success) {
          app.globalData.openid = res.result.data.openid;
          resolve(res.result.data.openid);
        } else {
          reject(new Error('获取 openid 失败'));
        }
      },
      fail: reject
    });
  });
}

/**
 * 获取用户信息
 * @returns {Promise<object>}
 */
export async function getUserProfile() {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        app.globalData.userInfo = res.userInfo;
        resolve(res.userInfo);
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 完整登录流程
 * @returns {Promise<{openid, userInfo}>}
 */
export async function login() {
  try {
    // 1. 获取 openid
    const openid = await getOpenid();

    // 2. 获取用户信息
    const userInfo = await getUserProfile();

    // 3. 保存到云数据库
    await wx.cloud.callFunction({
      name: 'updateUserProfile',
      data: {
        userInfo: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          gender: userInfo.gender
        }
      }
    });

    return { openid, userInfo };
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
}

/**
 * 检查并引导登录
 * @returns {Promise<boolean>}
 */
export async function checkAndGuideLogin() {
  if (isLoggedIn()) {
    return true;
  }

  return new Promise((resolve) => {
    wx.showModal({
      title: '需要登录',
      content: '请先登录后使用此功能',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }
        resolve(false);
      }
    });
  });
}

/**
 * 退出登录
 */
export function logout() {
  app.globalData.openid = null;
  app.globalData.userInfo = null;
  wx.removeStorageSync('userInfo');
  wx.removeStorageSync('openid');
}

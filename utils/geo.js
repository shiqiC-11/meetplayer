// geo.js - 地理位置相关工具函数

/**
 * 计算两点之间的距离（米）
 * 使用 Haversine 公式
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // 地球半径（米）
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

/**
 * 格式化距离显示
 * @param {number} meters - 距离（米）
 * @returns {string} 格式化后的距离
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 格式化日期时间
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @returns {string} 格式化后的日期时间，如 "1月5日 14:00"
 */
export function formatDateTime(date) {
  const d = new Date(date);

  // 检查日期是否有效
  if (isNaN(d.getTime())) {
    return '日期无效';
  }

  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours();
  const minute = d.getMinutes();

  return `${month}月${day}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * 获取当前位置
 * @returns {Promise<{latitude, longitude}>}
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude
        });
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 检查位置权限
 * @returns {Promise<boolean>}
 */
export function checkLocationPermission() {
  return new Promise((resolve) => {
    wx.getSetting({
      success: (res) => {
        if (res.authSettings['scope.userLocation']) {
          resolve(true);
        } else {
          resolve(false);
        }
      },
      fail: () => {
        resolve(false);
      }
    });
  });
}

/**
 * 请求位置权限
 * @returns {Promise<boolean>}
 */
export function requestLocationPermission() {
  return new Promise((resolve) => {
    wx.showModal({
      title: '需要位置权限',
      content: '我们需要您的位置来显示附近的球场',
      success: (res) => {
        if (res.confirm) {
          wx.openSetting({
            success: (settingRes) => {
              if (settingRes.authSettings['scope.userLocation']) {
                resolve(true);
              } else {
                resolve(false);
              }
            },
            fail: () => {
              resolve(false);
            }
          });
        } else {
          resolve(false);
        }
      }
    });
  });
}

/**
 * 选择位置（地图选点）
 * @returns {Promise<{name, address, latitude, longitude}>}
 */
export function chooseLocation() {
  return new Promise((resolve, reject) => {
    wx.chooseLocation({
      success: (res) => {
        resolve({
          name: res.name,
          address: res.address,
          latitude: res.latitude,
          longitude: res.longitude
        });
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 判断点是否在指定半径内
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @param {number} radius - 半径（米）
 * @returns {boolean}
 */
export function isInRadius(lat1, lng1, lat2, lng2, radius) {
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  return distance <= radius;
}

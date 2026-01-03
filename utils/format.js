// format.js - 格式化工具函数

/**
 * 格式化日期时间
 * @param {Date|string|number} date
 * @param {string} format - 格式：'date' | 'time' | 'datetime' | 'full'
 * @returns {string}
 */
export function formatDateTime(date, format = 'datetime') {
  if (!date) return '';

  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours();
  const minute = d.getMinutes();
  const second = d.getSeconds();

  const monthStr = month.toString().padStart(2, '0');
  const dayStr = day.toString().padStart(2, '0');
  const hourStr = hour.toString().padStart(2, '0');
  const minuteStr = minute.toString().padStart(2, '0');
  const secondStr = second.toString().padStart(2, '0');

  switch (format) {
    case 'date':
      return `${monthStr}-${dayStr}`;
    case 'time':
      return `${hourStr}:${minuteStr}`;
    case 'datetime':
      return `${monthStr}-${dayStr} ${hourStr}:${minuteStr}`;
    case 'full':
      return `${year}-${monthStr}-${dayStr} ${hourStr}:${minuteStr}:${secondStr}`;
    default:
      return `${monthStr}-${dayStr} ${hourStr}:${minuteStr}`;
  }
}

/**
 * 格式化相对时间（多久前）
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatRelativeTime(date) {
  if (!date) return '';

  const now = Date.now();
  const target = new Date(date).getTime();
  const diff = now - target;

  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;

  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < week) {
    return `${Math.floor(diff / day)}天前`;
  } else {
    return formatDateTime(date, 'date');
  }
}

/**
 * 格式化时间段
 * @param {Date|string} startTime
 * @param {Date|string} endTime
 * @returns {string}
 */
export function formatTimeRange(startTime, endTime) {
  const start = formatDateTime(startTime, 'time');
  const end = formatDateTime(endTime, 'time');
  return `${start}-${end}`;
}

/**
 * 格式化价格
 * @param {number} price
 * @returns {string}
 */
export function formatPrice(price) {
  if (price === 0 || price === null || price === undefined) {
    return '免费';
  }
  return `¥${price}`;
}

/**
 * 格式化评分
 * @param {number} rating
 * @param {number} decimals
 * @returns {string}
 */
export function formatRating(rating, decimals = 1) {
  if (!rating) return '0.0';
  return rating.toFixed(decimals);
}

/**
 * 格式化手机号（隐藏中间四位）
 * @param {string} phone
 * @returns {string}
 */
export function formatPhone(phone) {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

/**
 * 获取星期几
 * @param {Date|string|number} date
 * @returns {string}
 */
export function getWeekday(date) {
  const d = new Date(date);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[d.getDay()];
}

/**
 * 判断是否是今天
 * @param {Date|string|number} date
 * @returns {boolean}
 */
export function isToday(date) {
  const d = new Date(date);
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

/**
 * 判断是否是明天
 * @param {Date|string|number} date
 * @returns {boolean}
 */
export function isTomorrow(date) {
  const d = new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d.getDate() === tomorrow.getDate() &&
         d.getMonth() === tomorrow.getMonth() &&
         d.getFullYear() === tomorrow.getFullYear();
}

/**
 * 格式化日期显示（今天、明天、周几）
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDateDisplay(date) {
  if (isToday(date)) {
    return '今天';
  } else if (isTomorrow(date)) {
    return '明天';
  } else {
    return `${formatDateTime(date, 'date')} ${getWeekday(date)}`;
  }
}

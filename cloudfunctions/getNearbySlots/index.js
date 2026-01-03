// getNearbySlots 云函数 - 获取附近约球局
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const { lat, lng, radius = 5000, filters = {} } = event;

    if (!lat || !lng) {
      return {
        success: false,
        message: '缺少位置参数'
      };
    }

    // 直接使用 venue.location 地理位置查询（slots 已包含球场位置）
    const whereCondition = {
      'venue.location': _.geoNear({
        geometry: db.Geo.Point(lng, lat),
        maxDistance: radius
      }),
      status: 'open',
      datetime: _.gte(new Date())
    };

    // 应用筛选条件 - 双等级体系
    if (filters.simpleLevel && filters.simpleLevel.length > 0) {
      whereCondition['requirement.simpleLevel'] = _.in(filters.simpleLevel);
    }

    if (filters.gender && filters.gender !== 0) {
      whereCondition['requirement.gender'] = _.in([0, filters.gender]); // 0=不限
    }

    if (filters.dateStart && filters.dateEnd) {
      whereCondition.datetime = _.and([
        _.gte(new Date(filters.dateStart)),
        _.lte(new Date(filters.dateEnd))
      ]);
    }

    // 查询约球局
    const slotsResult = await db.collection('slots')
      .where(whereCondition)
      .orderBy('datetime', 'asc')
      .limit(50)
      .get();

    const slots = slotsResult.data;

    // 获取球场和主办人信息
    const venueIds = [...new Set(slots.map(s => s.venueId).filter(id => id))];
    const hostIds = [...new Set(slots.map(s => s._openid).filter(id => id))];

    // 批量获取球场信息
    let venuesMap = {};
    if (venueIds.length > 0) {
      const venuesResult = await db.collection('venues')
        .where({
          _id: _.in(venueIds)
        })
        .get();

      venuesResult.data.forEach(venue => {
        venuesMap[venue._id] = venue;
      });
    }

    // 批量获取主办人信息
    let hostsMap = {};
    if (hostIds.length > 0) {
      const hostsResult = await db.collection('users')
        .where({
          _openid: _.in(hostIds)
        })
        .field({
          _openid: true,
          nickName: true,
          avatarUrl: true,
          level: true,
          rating: true,
          creditScore: true,
          totalGames: true
        })
        .get();

      hostsResult.data.forEach(host => {
        hostsMap[host._openid] = host;
      });
    }

    // 添加球场和主办人信息到约球局
    slots.forEach(slot => {
      // 如果有 venueId，用完整的球场信息替换简化版
      if (slot.venueId && venuesMap[slot.venueId]) {
        slot.venue = venuesMap[slot.venueId];
      }

      // 添加主办人信息
      if (slot._openid && hostsMap[slot._openid]) {
        slot.host = hostsMap[slot._openid];
      }
    });

    return {
      success: true,
      data: slots
    };
  } catch (error) {
    console.error('getNearbySlots 云函数错误:', error);
    return {
      success: false,
      message: '查询失败',
      error: error.message
    };
  }
};

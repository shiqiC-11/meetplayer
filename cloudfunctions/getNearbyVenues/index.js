// getNearbyVenues 云函数 - 获取附近球场
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const { lat, lng, radius = 5000 } = event;

    if (!lat || !lng) {
      return {
        success: false,
        message: '缺少位置参数'
      };
    }

    // 查询附近球场（包括 verified 和 pending 状态）
    const venuesResult = await db.collection('venues')
      .where({
        location: _.geoNear({
          geometry: db.Geo.Point(lng, lat),
          maxDistance: radius
        }),
        status: _.in(['verified', 'pending'])
      })
      .limit(50)
      .get();

    const venues = venuesResult.data;

    // 获取每个球场的开放 Slots 数量
    const venueIds = venues.map(v => v._id);

    if (venueIds.length > 0) {
      const slotsResult = await db.collection('slots')
        .where({
          venueId: _.in(venueIds),
          status: 'open',
          datetime: _.gte(new Date())
        })
        .field({
          venueId: true
        })
        .get();

      // 统计每个球场的 Slots 数量
      const slotCounts = {};
      slotsResult.data.forEach(slot => {
        slotCounts[slot.venueId] = (slotCounts[slot.venueId] || 0) + 1;
      });

      // 添加 Slots 数量到球场数据
      venues.forEach(venue => {
        venue.openSlotsCount = slotCounts[venue._id] || 0;
      });
    } else {
      venues.forEach(venue => {
        venue.openSlotsCount = 0;
      });
    }

    return {
      success: true,
      data: venues
    };
  } catch (error) {
    console.error('getNearbyVenues 云函数错误:', error);
    return {
      success: false,
      message: '查询失败',
      error: error.message
    };
  }
};

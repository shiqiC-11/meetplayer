// createVenue 云函数 - 创建球场
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    const {
      name,
      lat,
      lng,
      address = {},
      courts = {},
      facilities = [],
      pricing = {},
      contact = {},
      photos = []
    } = event;

    // 验证必填字段
    if (!name || !lat || !lng) {
      return {
        success: false,
        message: '缺少必要参数：球场名称或位置'
      };
    }

    // 检查附近是否有重复球场（100米内，名称相同）
    const nearbyVenues = await db.collection('venues')
      .where({
        location: _.geoNear({
          geometry: db.Geo.Point(lng, lat),
          maxDistance: 100
        })
      })
      .get();

    // 检查是否存在同名球场
    for (let venue of nearbyVenues.data) {
      if (venue.name === name) {
        return {
          success: false,
          message: '该球场已存在',
          data: venue
        };
      }
    }

    // 构建球场记录（符合 PRD 数据模型）
    const venueRecord = {
      name,
      location: db.Geo.Point(lng, lat),

      address: {
        province: address.province || '',
        city: address.city || '',
        district: address.district || '',
        detail: address.detail || ''
      },

      courts: {
        total: courts.total || 1,
        indoor: courts.indoor || false,
        lighting: courts.lighting || true,
        surface: courts.surface || '硬地'  // 硬地/红土/草地
      },

      facilities: facilities,  // ['停车', '更衣室', '淋浴']

      rating: {
        overall: 0,
        environment: 0,
        service: 0,
        count: 0
      },

      pricing: {
        peak: pricing.peak || 0,
        offPeak: pricing.offPeak || 0
      },

      contact: {
        phone: contact.phone || '',
        hours: contact.hours || ''
      },

      photos: photos,

      status: 'pending',  // 用户创建的球场需要审核
      createdBy: openid,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    };

    // 插入球场记录
    const result = await db.collection('venues').add({
      data: venueRecord
    });

    console.log('球场创建成功:', result._id);

    return {
      success: true,
      message: '球场创建成功，等待审核',
      data: {
        _id: result._id,
        ...venueRecord
      }
    };
  } catch (error) {
    console.error('createVenue 云函数错误:', error);
    return {
      success: false,
      message: '创建失败，请重试',
      error: error.message
    };
  }
};

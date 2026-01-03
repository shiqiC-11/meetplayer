// getVenueDetail 云函数 - 获取球场详情
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

    const { venueId } = event;

    // 验证参数
    if (!venueId) {
      return {
        success: false,
        message: '缺少球场 ID'
      };
    }

    // 获取球场信息
    const venueResult = await db.collection('venues').doc(venueId).get();

    if (!venueResult.data) {
      return {
        success: false,
        message: '球场不存在'
      };
    }

    const venue = venueResult.data;

    // 获取该球场的约球局统计
    const now = new Date();

    // 即将进行的约球局（未来 7 天内）
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingSlotsResult = await db.collection('slots')
      .where({
        venueId: venueId,
        status: _.in(['open', 'full']),
        datetime: _.gte(now).and(_.lte(futureDate))
      })
      .orderBy('datetime', 'asc')
      .limit(20)
      .get();

    const upcomingSlots = upcomingSlotsResult.data || [];

    // 总约球局数量
    const totalSlotsResult = await db.collection('slots')
      .where({
        venueId: venueId
      })
      .count();

    const totalSlots = totalSlotsResult.total || 0;

    // 获取球场评价（如果有评价系统的话）
    let reviews = [];
    try {
      const reviewsResult = await db.collection('venue_reviews')
        .where({
          venueId: venueId
        })
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      if (reviewsResult.data && reviewsResult.data.length > 0) {
        // 获取评价者的用户信息
        reviews = await Promise.all(
          reviewsResult.data.map(async (review) => {
            const userResult = await db.collection('users')
              .where({ _openid: review._openid })
              .field({
                nickName: true,
                avatarUrl: true,
                level: true
              })
              .get();

            review.reviewer = userResult.data[0] || null;
            return review;
          })
        );
      }
    } catch (error) {
      console.log('获取评价失败（可能评价系统还未实现）:', error.message);
      // 忽略评价系统的错误
    }

    // 获取创建者信息（如果是用户创建的球场）
    let creator = null;
    if (venue.createdBy) {
      const creatorResult = await db.collection('users')
        .where({ _openid: venue.createdBy })
        .field({
          nickName: true,
          avatarUrl: true
        })
        .get();

      creator = creatorResult.data[0] || null;
    }

    // 返回完整的球场信息
    const result = {
      ...venue,
      upcomingSlots,
      upcomingSlotsCount: upcomingSlots.length,
      totalSlots,
      reviews,
      reviewsCount: reviews.length,
      creator
    };

    console.log('获取球场详情成功:', venueId);

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('getVenueDetail 云函数错误:', error);
    return {
      success: false,
      message: '获取失败，请重试',
      error: error.message
    };
  }
};

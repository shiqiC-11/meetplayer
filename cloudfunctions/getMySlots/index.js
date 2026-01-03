// getMySlots 云函数 - 获取我的约球
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

    const { type } = event;

    // 验证参数
    if (!type || !['created', 'joined'].includes(type)) {
      return {
        success: false,
        message: '无效的类型参数，请使用 created 或 joined'
      };
    }

    let slots = [];

    if (type === 'created') {
      // 获取我创建的约球局
      const result = await db.collection('slots')
        .where({
          _openid: openid
        })
        .orderBy('datetime', 'desc')
        .limit(100)
        .get();

      slots = result.data || [];

    } else if (type === 'joined') {
      // 获取我加入的约球局
      // 1. 先查找我已通过的申请
      const applicationsResult = await db.collection('applications')
        .where({
          _openid: openid,
          status: 'approved'
        })
        .field({
          slotId: true
        })
        .limit(100)
        .get();

      if (!applicationsResult.data || applicationsResult.data.length === 0) {
        // 没有已通过的申请
        return {
          success: true,
          data: []
        };
      }

      // 2. 提取所有 slotId
      const slotIds = applicationsResult.data.map(app => app.slotId);

      // 3. 批量查询这些 slots
      const slotsResult = await db.collection('slots')
        .where({
          _id: _.in(slotIds)
        })
        .orderBy('datetime', 'desc')
        .get();

      slots = slotsResult.data || [];
    }

    // 对所有 slots 增加额外信息
    const enrichedSlots = await Promise.all(
      slots.map(async (slot) => {
        // 获取完整的球场信息
        if (slot.venueId) {
          try {
            const venueResult = await db.collection('venues').doc(slot.venueId).get();
            if (venueResult.data) {
              slot.venue = venueResult.data;
            }
          } catch (error) {
            console.error('获取球场信息失败:', error);
            // 保持原有的 venue 信息
          }
        }

        // 获取主办人信息（如果不是我自己）
        if (slot._openid && slot._openid !== openid) {
          const hostResult = await db.collection('users')
            .where({ _openid: slot._openid })
            .field({
              _openid: true,
              nickName: true,
              avatarUrl: true,
              level: true,
              rating: true
            })
            .get();

          slot.host = hostResult.data[0] || null;
        } else if (!slot._openid || slot._openid === openid) {
          // 如果是自己创建的，获取申请数量
          const appCountResult = await db.collection('applications')
            .where({
              slotId: slot._id,
              status: 'pending'
            })
            .count();

          slot.pendingApplicationsCount = appCountResult.total || 0;
        }

        return slot;
      })
    );

    console.log(`获取 ${type} 约球成功:`, enrichedSlots.length);

    return {
      success: true,
      data: enrichedSlots
    };

  } catch (error) {
    console.error('getMySlots 云函数错误:', error);
    return {
      success: false,
      message: '获取失败，请重试',
      error: error.message
    };
  }
};

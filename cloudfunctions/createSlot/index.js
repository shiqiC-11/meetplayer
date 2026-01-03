// createSlot 云函数 - 创建约球局
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
      sport = '网球',
      venueId,
      datetime,
      duration = 120,
      requirement = {},
      cost = {},
      description = ''
    } = event;

    // 验证必填字段
    if (!venueId || !datetime) {
      return {
        success: false,
        message: '缺少必要参数：球场ID或时间'
      };
    }

    // 验证时间（不能是过去的时间）
    const slotDatetime = new Date(datetime);
    if (slotDatetime <= new Date()) {
      return {
        success: false,
        message: '约球时间不能早于当前时间'
      };
    }

    // 检查球场是否存在并获取球场信息
    const venueResult = await db.collection('venues').doc(venueId).get();
    if (!venueResult.data) {
      return {
        success: false,
        message: '球场不存在'
      };
    }

    const venue = venueResult.data;

    // 构建 requirement 对象（双等级体系）
    const slotRequirement = {
      simpleLevel: requirement.simpleLevel || ['中级'],  // 简化等级（数组）
      ntrpRange: requirement.ntrpRange || null,  // NTRP 范围（可选）
      gender: requirement.gender || 0,  // 0=不限 1=男 2=女
      needCount: requirement.needCount || 2  // 还需要人数
    };

    // 构建 cost 对象
    const slotCost = {
      type: cost.type || 'free',  // free/aa/partial
      total: cost.total || 0,
      hostPays: cost.hostPays || 0,
      perPerson: 0
    };

    // 计算每人应付费用
    if (slotCost.type !== 'free' && slotRequirement.needCount > 0) {
      slotCost.perPerson = Math.ceil(
        (slotCost.total - slotCost.hostPays) / slotRequirement.needCount
      );
    }

    // 创建约球局记录（符合 PRD 数据模型）
    const slotRecord = {
      sport,
      datetime: slotDatetime,
      duration,

      venueId,
      venue: {
        name: venue.name,
        location: venue.location  // GeoJSON Point
      },

      requirement: slotRequirement,
      cost: slotCost,

      currentCount: 0,  // 当前已加入人数（不含主办人）
      participants: [],  // 已加入的参与者 openid 数组

      description,
      status: 'open',

      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    };

    // 插入 Slot（_openid 会自动添加）
    const result = await db.collection('slots').add({
      data: slotRecord
    });

    console.log('Slot 创建成功:', result._id);

    return {
      success: true,
      message: '约球局创建成功',
      data: {
        _id: result._id,
        _openid: openid,
        ...slotRecord
      }
    };
  } catch (error) {
    console.error('createSlot 云函数错误:', error);
    return {
      success: false,
      message: '创建失败，请重试',
      error: error.message
    };
  }
};

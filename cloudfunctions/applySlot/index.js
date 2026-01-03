// applySlot 云函数 - 申请加入约球局
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

    const { slotId, message = '' } = event;

    if (!slotId) {
      return {
        success: false,
        message: '缺少约球局ID'
      };
    }

    // 获取约球局信息
    const slotResult = await db.collection('slots').doc(slotId).get();

    if (!slotResult.data) {
      return {
        success: false,
        message: '约球局不存在'
      };
    }

    const slot = slotResult.data;

    // 验证约球局状态
    if (slot.status !== 'open') {
      return {
        success: false,
        message: '该约球局已关闭'
      };
    }

    // 检查是否已满员
    if (slot.currentCount >= slot.requirement.needCount) {
      return {
        success: false,
        message: '该约球局已满员'
      };
    }

    // 检查是否是主办人
    if (openid === slot._openid) {
      return {
        success: false,
        message: '您是主办人，无需申请'
      };
    }

    // 检查是否已经是参与者
    if (slot.participants && slot.participants.includes(openid)) {
      return {
        success: false,
        message: '您已经是参与者'
      };
    }

    // 检查是否已申请
    const existingApplication = await db.collection('applications')
      .where({
        slotId,
        _openid: openid,
        status: _.in(['pending', 'approved'])
      })
      .get();

    if (existingApplication.data.length > 0) {
      return {
        success: false,
        message: '您已申请过该约球局'
      };
    }

    // 创建申请记录（_openid 会自动添加为申请人）
    const applicationRecord = {
      slotId,
      hostId: slot._openid,  // 主办人 openid
      message,
      status: 'pending',  // pending/approved/rejected
      createdAt: db.serverDate()
    };

    const result = await db.collection('applications').add({
      data: applicationRecord
    });

    console.log('申请已创建:', result._id);

    return {
      success: true,
      message: '申请已提交，等待主办人审核',
      data: {
        _id: result._id,
        _openid: openid,
        ...applicationRecord
      }
    };
  } catch (error) {
    console.error('applySlot 云函数错误:', error);
    return {
      success: false,
      message: '申请失败，请重试',
      error: error.message
    };
  }
};

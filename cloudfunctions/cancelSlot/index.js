// cancelSlot 云函数 - 取消约球局
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

    const { slotId, reason = '' } = event;

    // 验证参数
    if (!slotId) {
      return {
        success: false,
        message: '缺少必要参数'
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

    // 验证权限（只有主办人可以取消）
    if (slot._openid !== openid) {
      return {
        success: false,
        message: '只有主办人可以取消约球局'
      };
    }

    // 验证约球局状态（只能取消 open 或 full 状态的约球局）
    if (!['open', 'full'].includes(slot.status)) {
      return {
        success: false,
        message: '该约球局无法取消'
      };
    }

    // 更新约球局状态
    await db.collection('slots').doc(slotId).update({
      data: {
        status: 'cancelled',
        cancelReason: reason,
        cancelledAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    });

    // 更新所有已通过的申请为已取消状态
    const applicationsResult = await db.collection('applications')
      .where({
        slotId: slotId,
        status: 'approved'
      })
      .get();

    if (applicationsResult.data && applicationsResult.data.length > 0) {
      // 批量更新申请状态
      const updatePromises = applicationsResult.data.map(app => {
        return db.collection('applications').doc(app._id).update({
          data: {
            status: 'cancelled',
            cancelReason: reason,
            cancelledAt: db.serverDate()
          }
        });
      });

      await Promise.all(updatePromises);

      console.log(`已取消 ${applicationsResult.data.length} 个申请`);
    }

    console.log('约球局已取消:', slotId);

    return {
      success: true,
      message: '约球局已取消',
      data: {
        slotId,
        status: 'cancelled',
        affectedApplications: applicationsResult.data ? applicationsResult.data.length : 0
      }
    };

  } catch (error) {
    console.error('cancelSlot 云函数错误:', error);
    return {
      success: false,
      message: '取消失败，请重试',
      error: error.message
    };
  }
};

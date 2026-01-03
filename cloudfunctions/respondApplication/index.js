// respondApplication 云函数 - 审核申请
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

    const { applicationId, action, reason = '' } = event;

    // 验证参数
    if (!applicationId || !action) {
      return {
        success: false,
        message: '缺少必要参数'
      };
    }

    if (!['approve', 'reject'].includes(action)) {
      return {
        success: false,
        message: '无效的操作类型'
      };
    }

    // 获取申请信息
    const appResult = await db.collection('applications').doc(applicationId).get();

    if (!appResult.data) {
      return {
        success: false,
        message: '申请不存在'
      };
    }

    const application = appResult.data;

    // 验证申请状态
    if (application.status !== 'pending') {
      return {
        success: false,
        message: '申请已处理，无法重复操作'
      };
    }

    // 获取约球局信息
    const slotResult = await db.collection('slots').doc(application.slotId).get();

    if (!slotResult.data) {
      return {
        success: false,
        message: '约球局不存在'
      };
    }

    const slot = slotResult.data;

    // 验证权限（只有主办人可以审核）
    if (slot._openid !== openid) {
      return {
        success: false,
        message: '只有主办人可以审核申请'
      };
    }

    // 验证约球局状态
    if (slot.status !== 'open') {
      return {
        success: false,
        message: '约球局已关闭，无法审核'
      };
    }

    // 开始事务处理
    if (action === 'approve') {
      // 通过申请

      // 检查是否已满员
      if (slot.currentCount >= slot.requirement.needCount) {
        return {
          success: false,
          message: '约球局已满员'
        };
      }

      // 更新申请状态
      await db.collection('applications').doc(applicationId).update({
        data: {
          status: 'approved',
          reviewedAt: db.serverDate(),
          reason
        }
      });

      // 更新约球局：添加参与者，增加人数
      const participants = slot.participants || [];
      participants.push(application._openid);

      const updateData = {
        participants,
        currentCount: _.inc(1),
        updatedAt: db.serverDate()
      };

      // 如果满员，更新状态为 full
      if (slot.currentCount + 1 >= slot.requirement.needCount) {
        updateData.status = 'full';
      }

      await db.collection('slots').doc(application.slotId).update({
        data: updateData
      });

      console.log('申请已通过:', applicationId);

      return {
        success: true,
        message: '已通过申请',
        data: {
          applicationId,
          status: 'approved'
        }
      };

    } else {
      // 拒绝申请

      // 更新申请状态
      await db.collection('applications').doc(applicationId).update({
        data: {
          status: 'rejected',
          reviewedAt: db.serverDate(),
          reason
        }
      });

      console.log('申请已拒绝:', applicationId);

      return {
        success: true,
        message: '已拒绝申请',
        data: {
          applicationId,
          status: 'rejected'
        }
      };
    }

  } catch (error) {
    console.error('respondApplication 云函数错误:', error);
    return {
      success: false,
      message: '处理失败，请重试',
      error: error.message
    };
  }
};

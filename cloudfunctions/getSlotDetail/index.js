// getSlotDetail 云函数 - 获取约球局详情
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
    const { slotId } = event;

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

    // 获取主办人信息（slot._openid 是主办人）
    const hostResult = await db.collection('users')
      .where({ _openid: slot._openid })
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

    slot.host = hostResult.data[0] || null;

    // 获取参与者信息
    if (slot.participants && slot.participants.length > 0) {
      const participantsResult = await db.collection('users')
        .where({
          _openid: _.in(slot.participants)
        })
        .field({
          _openid: true,
          nickName: true,
          avatarUrl: true,
          level: true,
          rating: true,
          creditScore: true
        })
        .get();

      const participantsMap = {};
      participantsResult.data.forEach(participant => {
        participantsMap[participant._openid] = participant;
      });

      slot.participantsList = slot.participants.map(id => participantsMap[id]).filter(p => p);
    } else {
      slot.participantsList = [];
    }

    // 如果当前用户是主办人，获取申请列表
    if (openid === slot._openid) {
      const applicationsResult = await db.collection('applications')
        .where({
          slotId,
          status: 'pending'
        })
        .orderBy('createdAt', 'desc')
        .get();

      // 获取申请人信息
      if (applicationsResult.data.length > 0) {
        const applicantIds = applicationsResult.data.map(app => app._openid);
        const applicantsResult = await db.collection('users')
          .where({
            _openid: _.in(applicantIds)
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

        const applicantsMap = {};
        applicantsResult.data.forEach(applicant => {
          applicantsMap[applicant._openid] = applicant;
        });

        applicationsResult.data.forEach(app => {
          app.applicant = applicantsMap[app._openid] || null;
        });

        slot.applications = applicationsResult.data;
      } else {
        slot.applications = [];
      }
    }

    // 检查当前用户是否已申请
    if (openid !== slot._openid) {
      const myApplicationResult = await db.collection('applications')
        .where({
          slotId,
          _openid: openid
        })
        .get();

      slot.hasApplied = myApplicationResult.data.length > 0;
      slot.myApplication = myApplicationResult.data[0] || null;
    } else {
      slot.hasApplied = false;
      slot.myApplication = null;
    }

    return {
      success: true,
      data: slot
    };
  } catch (error) {
    console.error('getSlotDetail 云函数错误:', error);
    return {
      success: false,
      message: '查询失败，请重试',
      error: error.message
    };
  }
};

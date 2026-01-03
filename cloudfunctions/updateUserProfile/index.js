// updateUserProfile 云函数 - 更新用户信息
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const { userInfo } = event;

    if (!userInfo) {
      return {
        success: false,
        message: '缺少用户信息参数'
      };
    }

    // 检查用户是否存在
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .get();

    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在，请先登录'
      };
    }

    const existingUser = userResult.data[0];

    // 构建更新数据
    const updateData = {
      updatedAt: db.serverDate()
    };

    // 基础字段更新
    const basicFields = ['nickName', 'avatarUrl', 'gender', 'location'];
    basicFields.forEach(field => {
      if (userInfo[field] !== undefined) {
        updateData[field] = userInfo[field];
      }
    });

    // 双等级体系更新
    if (userInfo.level) {
      const levelUpdate = {};

      // 简化等级
      if (userInfo.level.simple) {
        levelUpdate.simple = userInfo.level.simple;
      }

      // NTRP 等级
      if (userInfo.level.ntrp !== undefined) {
        levelUpdate.ntrp = userInfo.level.ntrp;
      }

      // 认证相关
      if (userInfo.level.verified !== undefined) {
        levelUpdate.verified = userInfo.level.verified;
      }
      if (userInfo.level.verifiedType) {
        levelUpdate.verifiedType = userInfo.level.verifiedType;
        levelUpdate.verifiedAt = new Date();
      }

      levelUpdate.lastUpdated = new Date();

      // 合并等级更新
      updateData['level'] = {
        ...existingUser.level,
        ...levelUpdate
      };
    }

    // 收藏球场更新（数组操作）
    if (userInfo.favoriteVenues) {
      updateData.favoriteVenues = userInfo.favoriteVenues;
    }

    // 执行更新
    await db.collection('users')
      .doc(existingUser._id)
      .update({
        data: updateData
      });

    // 获取更新后的用户信息
    const updatedUserResult = await db.collection('users')
      .doc(existingUser._id)
      .get();

    console.log('用户信息更新成功:', openid);

    return {
      success: true,
      message: '用户信息已更新',
      data: updatedUserResult.data
    };
  } catch (error) {
    console.error('updateUserProfile 云函数错误:', error);
    return {
      success: false,
      message: '更新失败，请重试',
      error: error.message
    };
  }
};

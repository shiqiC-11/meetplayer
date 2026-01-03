// login 云函数 - 用户登录获取 openid
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    // 检查用户是否已存在
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .get();

    let userData;
    let isNewUser = false;

    if (userResult.data.length === 0) {
      // 新用户，创建初始记录（完整的用户数据模型）
      const newUser = {
        _openid: openid,
        nickName: '',  // 待用户授权后更新
        avatarUrl: '',  // 待用户授权后更新
        gender: 0,  // 0未知 1男 2女

        // 双等级体系
        level: {
          "tennis": {
            simple: '新手',  // 简化等级（默认新手）
            ntrp: 1.0,  // NTRP 等级（默认 1.0）
            verified: false,  // 是否已认证
            verifiedType: null,  // 认证类型：video/certificate/coach
            verifiedAt: null,
            lastUpdated: new Date(),
            calibrationCount: 0,  // 完成场次（用于提示校准）
            description: "刚开始学，还不太会打"
          },
          "badminton": {
            simple: '新手',  // 简化等级（默认新手）
            verified: false,  // 是否已认证
            verifiedType: null,  // 认证类型：video/certificate/coach
            verifiedAt: null,
            lastUpdated: new Date(),
            calibrationCount: 0, // 完成场次（用于提示校准）
            description: "刚开始学，还不太会打"
          },
          "squash": {
            simple: '新手',  // 简化等级（默认新手）
            verified: false,  // 是否已认证
            verifiedType: null,  // 认证类型：video/certificate/coach
            verifiedAt: null,
            lastUpdated: new Date(),
            calibrationCount: 0, // 完成场次（用于提示校准）
            description: "刚开始学，还不太会打"
          }
        },

        sports: ['tennis', 'badminton', 'squash'],  // 擅长运动
        rating: 5.0,  // 用户评分（初始满分）
        totalGames: 0,  // 总场次
        creditScore: 100,  // 信用分（初始100）

        location: null,  // 常用位置（待用户设置）
        favoriteVenues: [],  // 收藏的球场

        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      };

      const createResult = await db.collection('users').add({
        data: newUser
      });

      userData = {
        ...newUser,
        _id: createResult._id
      };
      isNewUser = true;

      console.log('新用户创建成功:', openid);
    } else {
      // 已存在用户，返回用户信息
      userData = userResult.data[0];
      isNewUser = false;

      // 更新最后登录时间
      await db.collection('users').doc(userData._id).update({
        data: {
          updatedAt: db.serverDate()
        }
      });

      console.log('用户登录成功:', openid);
    }

    return {
      success: true,
      data: {
        openid,
        user: userData,
        isNewUser
      },
      message: isNewUser ? '欢迎新用户！' : '登录成功'
    };
  } catch (error) {
    console.error('login 云函数错误:', error);
    return {
      success: false,
      message: '登录失败，请重试',
      error: error.message
    };
  }
};

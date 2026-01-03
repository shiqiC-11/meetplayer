// getUserProfile 云函数 - 获取用户资料
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    // 查询用户资料
    const userResult = await db.collection('users')
      .where({
        _openid: openid
      })
      .limit(1)
      .get();

    if (userResult.data.length === 0) {
      // 用户不存在，返回默认资料
      console.log("user doesn't exist, return defualt profile")
      return {
        success: true,
        data: {
          _openid: openid,
          nickname: '网球爱好者',
          avatarUrl: '',
          level: '中级',
          ntrpLevel: null,
          gender: 0,
          bio: '',
          rating: 5.0,
          completedSlots: 0,
          isNewUser: true
        }
      };
    }

    return {
      success: true,
      data: userResult.data[0]
    };
  } catch (error) {
    console.error('getUserProfile 云函数错误:', error);
    return {
      success: false,
      message: '获取用户资料失败',
      error: error.message
    };
  }
};

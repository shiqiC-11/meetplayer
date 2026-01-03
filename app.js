App({
  onLaunch(options) {
    console.log('MeetPlayer 小程序启动', options);
    // 初始化云开发
    this.cloudInitPromise = new Promise((resolve, reject) => {
      if (!wx.cloud) {
        const errorMsg = '请使用 2.2.3 或以上的基础库以使用云能力';
        console.error(errorMsg);
        reject(errorMsg);
      } else {
        wx.cloud.init({
          env: 'cloud1-7gjqbm89df906c2e', // 精准云环境ID
          traceUser: true
        });
        console.log('云初始化配置已执行');
        resolve('云初始化完成');
      }
    });

    // 检查更新
    this.checkUpdate();

    // 获取系统信息
    this.getSystemInfo();
  },

  // 其他原有方法不变（onShow、onHide、onError、checkUpdate、getSystemInfo）
  onShow(options) {
    console.log('MeetPlayer 小程序显示', options);
  },

  onHide() {
    console.log('MeetPlayer 小程序隐藏');
  },

  onError(error) {
    console.error('MeetPlayer 小程序错误', error);
  },

  checkUpdate() {
    // 你的原有代码，无需修改
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('发现新版本');
        }
      });
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });
      updateManager.onUpdateFailed(() => {
        wx.showModal({
          title: '更新失败',
          content: '新版本下载失败，请删除小程序后重新搜索打开',
          showCancel: false
        });
      });
    }
  },

  getSystemInfo() {
    // 你的原有代码，无需修改
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    console.log('系统信息', systemInfo);
  },

  // 全局数据
  globalData: {
    userInfo: null,
    openid: null,
    location: null,
    systemInfo: null
  }
});
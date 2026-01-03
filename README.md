# MeetPlayer - 约球小程序

一款帮助网球爱好者快速找到球友、组织约球的微信小程序。

## 项目概述

**项目名称：** MeetPlayer（约球小程序）

**核心功能：**
- 发布约球局（Slot），设置时间、地点、等级要求、费用
- 浏览附近的约球局（地图/列表模式）
- 申请加入并支付费用（AA 分摊）
- 球场标准化和评价系统
- 用户评价和信用体系

**技术栈：**
- 前端：微信小程序原生开发
- UI 组件库：Vant Weapp
- 后端：微信云开发（云函数 + 云数据库）
- 地图：腾讯地图（微信地图 API）

## 项目结构

```
meetplayer/
├── pages/                    # 页面
│   ├── index/               # 首页（地图/列表）
│   ├── publish/             # 发布 Slot
│   ├── slot-detail/         # Slot 详情
│   ├── venue-detail/        # 球场详情
│   ├── venue-list/          # 球场列表
│   ├── my/                  # 个人中心
│   ├── my-slots/            # 我的 Slots
│   └── login/               # 登录页
├── components/              # 自定义组件
│   ├── slot-card/          # Slot 卡片
│   ├── venue-card/         # 球场卡片
│   ├── level-picker/       # 等级选择器
│   └── venue-picker/       # 球场选择器
├── utils/                   # 工具函数
│   ├── api.js              # API 封装
│   ├── auth.js             # 鉴权相关
│   ├── geo.js              # 地理位置计算
│   ├── format.js           # 格式化工具
│   ├── level.js            # 等级相关
│   └── constants.js        # 常量定义
├── cloudfunctions/          # 云函数
│   ├── login/              # 登录
│   ├── createSlot/         # 创建 Slot
│   ├── getNearbySlots/     # 获取附近 Slots
│   ├── applySlot/          # 申请加入
│   └── ...                 # 其他云函数
├── assets/                  # 静态资源
│   ├── images/             # 图片
│   └── icons/              # 图标
├── app.js                   # 小程序入口
├── app.json                 # 全局配置
├── app.wxss                 # 全局样式
├── project.config.json      # 项目配置
├── CLAUDE.md               # Claude Code 开发指南
├── PRD.md                  # 产品需求文档
└── README.md               # 本文件
```

## 快速开始

### 1. 环境准备

- 安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 注册微信小程序账号
- 开通云开发环境

### 2. 安装依赖

```bash
npm install
```

### 3. 构建 npm

在微信开发者工具中：
1. 点击菜单栏：工具 → 构建 npm
2. 等待构建完成

### 4. 配置云开发

1. 在微信开发者工具中开通云开发
2. 创建云开发环境（建议创建两个：开发环境和生产环境）
3. 修改 `app.js` 中的云开发环境 ID：

```javascript
wx.cloud.init({
  env: 'your-env-id', // 替换为你的云开发环境 ID
  traceUser: true
});
```

### 5. 部署云函数

1. 右键点击 `cloudfunctions` 目录下的云函数文件夹
2. 选择"上传并部署：云端安装依赖"

### 6. 创建数据库集合

在云开发控制台创建以下集合：
- `users` - 用户表
- `venues` - 球场表
- `slots` - 约球局表
- `applications` - 申请表
- `reviews` - 评价表
- `venue_reviews` - 球场评价表
- `payment_records` - 支付记录表
- `payment_settings` - 支付设置表

### 7. 运行项目

1. 在微信开发者工具中打开项目
2. 点击"编译"按钮
3. 在模拟器或真机上预览

## 开发规范

### 代码规范

**命名规范：**
- 文件名：小写 + 连字符（如：`slot-list.wxml`）
- 变量名：驼峰命名（如：`slotList`）
- 常量：全大写 + 下划线（如：`MAX_SLOTS`）
- 云函数：小写 + 下划线（如：`create_slot`）

**小程序特定规范：**
- 使用 `rpx` 作为样式单位（750rpx = 屏幕宽度）
- 所有 API 调用必须有错误处理
- 用户交互使用 `wx.showToast` 或 `wx.showModal` 反馈
- 列表渲染使用 `wx:key` 提升性能

### 数据库规范

**集合命名：**
- 使用小写字母和下划线
- 例如：`users`、`venues`、`slots`

**字段命名：**
- 使用驼峰命名（如：`createdAt`）
- 时间字段统一用 `Date` 类型
- 地理位置使用 `db.Geo.Point(lng, lat)` 格式
- 状态字段使用字符串枚举（如：`"open"/"closed"`）

## 开发进度

### Phase 1: 基础框架 ✅

- [x] 项目初始化
- [x] 配置 Vant Weapp
- [x] 创建页面结构
- [x] 创建工具函数
- [x] 实现登录页面
- [x] 实现个人中心页面

### Phase 2: 核心功能（进行中）

- [ ] 实现首页（地图/列表视图）
- [ ] 实现发布 Slot 功能
- [ ] 实现 Slot 详情页
- [ ] 实现申请加入流程
- [ ] 实现球场搜索和匹配

### Phase 3: 完善功能

- [ ] 实现支付分摊功能
- [ ] 实现球场详情页
- [ ] 实现评价系统
- [ ] 实现消息通知

### Phase 4: 优化和测试

- [ ] 性能优化
- [ ] 错误处理完善
- [ ] 全面测试
- [ ] 准备提交审核

## 功能特性

### 双等级体系

- **简化等级**（必选）：新手/初级/中级/高级/专业
- **NTRP 等级**（可选）：1.0-7.0（间隔 0.5）
- 系统自动显示简化等级 ↔ NTRP 对应关系

### 球场中心化

- 按球场聚合显示约球局
- 智能匹配避免重复球场
- 球场评价和照片分享系统

### 支付分摊

- **MVP：** 引导式微信转账（二维码/群收款）
- **Phase 2：** 微信支付集成，自动分账

### 地理位置

- 地图/列表双模式浏览
- 基于位置的筛选和排序
- 支持按距离、时间、等级筛选

## 常见问题

### Q1: 如何调试云函数？

在云函数目录下：
```bash
cd cloudfunctions/create_slot
npm install
node --inspect index.js
```

或者使用微信开发者工具的云函数调试功能。

### Q2: 如何处理地理位置权限？

参考 `utils/geo.js` 中的 `checkLocationPermission` 和 `requestLocationPermission` 函数。

### Q3: Vant Weapp 组件如何使用？

在 `app.json` 或页面的 `.json` 文件中配置：
```json
{
  "usingComponents": {
    "van-button": "@vant/weapp/button/index"
  }
}
```

## 文档

- [PRD.md](./PRD.md) - 产品需求文档
- [CLAUDE.md](./CLAUDE.md) - Claude Code 开发指南
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Vant Weapp 文档](https://vant-contrib.gitee.io/vant-weapp/)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

## License

MIT License

## 联系方式

- 作者：RollingForward
- GitHub: [项目地址]
- 问题反馈：[Issues]

---

**最后更新：** 2026-01-01
**版本：** v1.0.0

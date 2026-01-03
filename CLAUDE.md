# MeetPlayer - Claude Code 开发指南

## 项目概述

**项目名称：** MeetPlayer（约球小程序）  
**仓库名称：** meetplayer

这是一个微信小程序，帮助网球爱好者找到球友、组织约球。

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

---

## 重要规范

### 代码风格

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

**组件库使用：**
- 优先使用 Vant Weapp 组件
- 只使用 Tailwind 的核心 utility classes（我们没有编译器）
- 自定义组件放在 `/components` 目录

### 数据库规范

**集合命名：**
- users（用户表）
- venues（球场表）
- slots（约球局表）
- applications（申请表）
- reviews（评价表）
- venue_reviews（球场评价表）
- payment_records（支付记录表）
- payment_settings（支付设置表）

**字段命名：**
- 使用驼峰命名（如：`createdAt`）
- 时间字段统一用 `Date` 类型
- 地理位置使用 `db.Geo.Point(lng, lat)` 格式
- 状态字段使用字符串枚举（如：`"open"/"closed"`）

**查询优化：**
- 频繁查询的字段建立索引（特别是地理位置字段）
- 使用 `limit()` 限制返回数量
- 大列表使用分页加载

### 错误处理

**所有异步操作必须有错误处理：**

```javascript
// ✅ 正确
try {
  const result = await db.collection('slots').get();
  // 处理数据
} catch (error) {
  console.error('获取 Slots 失败:', error);
  wx.showToast({ title: '加载失败', icon: 'none' });
}

// ❌ 错误
const result = await db.collection('slots').get();
```

**用户友好的错误提示：**
- 网络错误："网络连接失败，请检查网络"
- 权限错误："需要您的授权才能使用此功能"
- 数据错误："加载失败，请稍后重试"

---

## 项目结构

```
tennis-buddy-miniprogram/
├── pages/                    # 页面
│   ├── index/               # 首页（地图/列表）
│   ├── publish/             # 发布 Slot
│   ├── slot-detail/         # Slot 详情
│   ├── venue-detail/        # 球场详情
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
│   └── constants.js        # 常量定义
├── cloudfunctions/          # 云函数
│   ├── create_slot/        # 创建 Slot
│   ├── get_nearby_slots/   # 获取附近 Slots
│   ├── apply_slot/         # 申请加入
│   ├── create_venue/       # 创建/匹配球场
│   └── submit_review/      # 提交评价
├── app.js                   # 小程序入口
├── app.json                 # 全局配置
├── app.wxss                 # 全局样式
├── project.config.json      # 项目配置
└── CLAUDE.md               # 本文件
```

---

## 核心功能实现指南

### 1. 用户登录和授权

**流程：**
1. 用户首次进入 → 调用 `wx.login()` 获取 code
2. 调用云函数 `login` 换取 openid
3. 请求用户授权 `wx.getUserProfile()`
4. 保存用户信息到数据库

**注意事项：**
- 必须在用户点击后才能调用 `getUserProfile`
- 用户拒绝授权时，提供游客模式（只能浏览）

### 2. 发布 Slot

**关键步骤：**
1. 选择球场（搜索已有 or 创建新球场）
2. 选择时间（日期 + 时间段）
3. 设置要求（等级、性别、人数）
4. 设置费用（免费/AA/部分承担）
5. 调用云函数 `create_slot`

**球场选择逻辑：**
- 优先搜索已有球场（防止重复）
- 智能匹配（地理位置 + 名称相似度）
- 如果找不到，引导用户创建新球场

### 3. 地图显示（按球场聚合）

**实现要点：**
- 使用 `<map>` 组件
- 调用 `get_venues_with_slots` 云函数获取数据
- 按 `venueId` 分组，每个球场显示一个标记
- 标记上显示该球场的 Slots 数量
- 点击标记弹出球场卡片

**性能优化：**
- 只加载地图可视范围内的球场
- 超过 50 个标记时使用聚合显示

### 4. 支付分摊（MVP 简化版）

**实现方式：**
- Host 设置总费用和承担金额
- 系统自动计算每人应付
- 显示微信收款二维码或群收款链接
- 用户转账后上传凭证
- Host 手动确认收款

**Phase 2 升级（微信支付）：**
- 接入微信支付 API
- 自动分账给 Host
- 支持自动退款

### 5. 等级系统

**双模式：**
- 简化等级：新手/初级/中级/高级/专业（必选）
- NTRP 等级：1.0-7.0（可选）

**显示策略：**
- 默认显示：中级 (NTRP 3.5)
- 筛选时支持两种模式切换
- 后端智能匹配（优先 NTRP，兜底简化等级）

---

## 常用 API 和工具函数

### 微信 API

```javascript
// 获取用户位置
wx.getLocation({
  type: 'gcj02',
  success: (res) => {
    const { latitude, longitude } = res;
  }
});

// 选择位置（发布时选球场）
wx.chooseLocation({
  success: (res) => {
    const { name, address, latitude, longitude } = res;
  }
});

// 显示 Toast
wx.showToast({
  title: '发布成功',
  icon: 'success',
  duration: 2000
});

// 显示加载中
wx.showLoading({ title: '加载中...' });
wx.hideLoading();

// 确认对话框
wx.showModal({
  title: '提示',
  content: '确定要取消吗？',
  success: (res) => {
    if (res.confirm) {
      // 用户点击确定
    }
  }
});
```

### 云数据库常用操作

```javascript
const db = wx.cloud.database();
const _ = db.command;

// 查询
const result = await db.collection('slots')
  .where({
    status: 'open',
    datetime: _.gte(new Date())
  })
  .orderBy('datetime', 'asc')
  .limit(20)
  .get();

// 地理位置查询（附近 5km）
const result = await db.collection('venues')
  .where({
    location: _.geoNear({
      geometry: db.Geo.Point(lng, lat),
      maxDistance: 5000
    })
  })
  .get();

// 插入
const result = await db.collection('slots').add({
  data: {
    venueId: 'venue_xxx',
    datetime: new Date('2026-01-05 14:00:00'),
    status: 'open',
    _openid: '{openid}', // 自动填充
    createdAt: db.serverDate()
  }
});

// 更新
await db.collection('slots').doc(slotId).update({
  data: {
    status: 'full',
    currentCount: _.inc(1) // 自增
  }
});

// 删除
await db.collection('slots').doc(slotId).remove();
```

### 工具函数

```javascript
// 计算两点距离（米）
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // 地球半径（米）
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// 格式化距离显示
function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

// 格式化时间
function formatDateTime(date) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours();
  const minute = d.getMinutes();
  
  return `${month}-${day} ${hour}:${minute.toString().padStart(2, '0')}`;
}

// 等级映射
const LEVEL_MAPPING = {
  "新手": { ntrpMin: 1.0, ntrpMax: 2.0 },
  "初级": { ntrpMin: 2.5, ntrpMax: 3.0 },
  "中级": { ntrpMin: 3.5, ntrpMax: 4.0 },
  "高级": { ntrpMin: 4.5, ntrpMax: 5.0 },
  "专业": { ntrpMin: 5.5, ntrpMax: 7.0 }
};
```

---

## 开发流程建议

### Phase 1: 基础框架（Day 1-2）

```bash
# Claude Code 命令示例
claude "初始化微信小程序项目，配置 Vant Weapp"
claude "创建项目基础结构：pages、components、utils、cloudfunctions"
claude "实现用户登录和个人资料页"
```

**交付物：**
- ✅ 项目结构完整
- ✅ 用户登录流程通过
- ✅ 可以在微信开发者工具中运行

### Phase 2: 核心功能（Day 3-7）

```bash
claude "实现发布 Slot 功能，包括球场选择和智能匹配"
claude "实现首页地图视图，按球场聚合显示 Slots"
claude "实现 Slot 详情页和申请加入流程"
```

**交付物：**
- ✅ 可以发布 Slot
- ✅ 可以浏览和搜索 Slots
- ✅ 可以申请加入

### Phase 3: 完善功能（Day 8-12）

```bash
claude "实现支付分摊功能（MVP 简化版）"
claude "实现球场详情页和评价系统"
claude "实现消息通知和个人中心"
```

**交付物：**
- ✅ 完整的用户闭环
- ✅ 球场系统运行正常
- ✅ 支付流程通畅

### Phase 4: 优化和测试（Day 13-14）

```bash
claude "优化性能，添加加载状态和错误处理"
claude "测试所有功能，修复 bugs"
claude "准备提交微信审核的材料"
```

**交付物：**
- ✅ 所有功能测试通过
- ✅ 用户体验流畅
- ✅ 准备好提交审核

---

## 常见问题和解决方案

### Q1: 云函数如何调用？

```javascript
// 在小程序中调用云函数
wx.cloud.callFunction({
  name: 'create_slot',
  data: {
    venueId: 'venue_xxx',
    datetime: '2026-01-05 14:00:00',
    // ...其他参数
  },
  success: res => {
    console.log('云函数调用成功:', res.result);
  },
  fail: err => {
    console.error('云函数调用失败:', err);
  }
});
```

### Q2: 如何处理地理位置权限？

```javascript
// 检查权限
wx.getSetting({
  success: (res) => {
    if (!res.authSettings['scope.userLocation']) {
      // 用户未授权，引导授权
      wx.showModal({
        title: '需要位置权限',
        content: '我们需要您的位置来显示附近的球场',
        success: (modalRes) => {
          if (modalRes.confirm) {
            wx.openSetting();
          }
        }
      });
    }
  }
});
```

### Q3: Vant Weapp 组件如何使用？

```javascript
// 1. 在 app.json 中配置
{
  "usingComponents": {
    "van-button": "@vant/weapp/button/index",
    "van-cell": "@vant/weapp/cell/index"
  }
}

// 2. 在页面中使用
<van-button type="primary" bind:click="onSubmit">
  发布约球
</van-button>
```

### Q4: 如何调试云函数？

```bash
# 在云函数目录下
cd cloudfunctions/create_slot
npm install
node --inspect index.js

# 或者使用微信开发者工具的云函数调试功能
```

---

## 性能优化清单

- [ ] 使用 `wx:key` 优化列表渲染
- [ ] 图片使用懒加载（`lazy-load="{{true}}"`)
- [ ] 分页加载长列表
- [ ] 云函数缓存频繁查询的数据
- [ ] 地理位置查询限制范围（如 5km）
- [ ] 使用 `setData` 时只更新必要的数据

---

## 安全注意事项

- [ ] 所有用户输入必须校验（前端 + 后端）
- [ ] 云函数中检查用户权限
- [ ] 敏感信息不要存在前端
- [ ] 防止 SQL 注入（使用参数化查询）
- [ ] 限制 API 调用频率

---

## 测试清单

### 功能测试
- [ ] 用户登录和授权
- [ ] 发布 Slot（各种场景）
- [ ] 浏览和搜索 Slots
- [ ] 申请加入和审核
- [ ] 支付分摊流程
- [ ] 球场创建和匹配
- [ ] 评价系统

### 边界测试
- [ ] 网络断开时的表现
- [ ] 权限被拒绝时的处理
- [ ] 数据为空时的显示
- [ ] 并发操作（两人同时申请）

### 兼容性测试
- [ ] iOS 和 Android 表现一致
- [ ] 不同屏幕尺寸适配
- [ ] 微信版本兼容性

---

## 提交审核准备

**必备材料：**
1. 隐私政策页面
2. 用户协议页面
3. 测试账号（供审核人员使用）
4. 功能截图和说明
5. 类目资质（如需要）

**常见被拒原因：**
- 缺少隐私政策
- 涉及未备案的支付功能
- 功能描述不清
- 存在明显 bug

---

## 版本管理

**Git 提交规范：**
```
feat: 添加发布 Slot 功能
fix: 修复地图标记点击无响应的问题
docs: 更新 README
style: 优化 Slot 卡片样式
refactor: 重构球场匹配算法
test: 添加单元测试
```

**分支策略：**
- `main`: 生产环境
- `develop`: 开发环境
- `feature/*`: 功能分支

---

## 联系方式

如有问题，请检查：
1. 微信小程序官方文档：https://developers.weixin.qq.com/miniprogram/dev/framework/
2. Vant Weapp 文档：https://vant-contrib.gitee.io/vant-weapp/
3. 微信云开发文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html

---

**最后更新：** 2026-01-01  
**版本：** v1.0
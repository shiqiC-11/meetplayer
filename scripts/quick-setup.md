# 快速配置清单 ✅

## 1. 云开发环境配置（已完成 ✅）

- [x] AppID: `wx464aeb308e7ed043`
- [x] 云环境ID: `cloud1-7gjqbm89df906c2e`
- [x] 云函数目录: `cloudfunctions/`

---

## 2. 数据库集合创建（待完成）

在**微信开发者工具** → **云开发** → **数据库**中创建以下集合：

### 必须创建的集合（MVP）

- [ ] **users** - 用户表
  - 索引: `_openid_` (唯一索引)

- [ ] **venues** - 球场表
  - 索引: `location_2dsphere` (地理位置索引)
  - 索引: `status_`

- [ ] **slots** - 约球局表
  - 索引: `_openid_`, `venueId_`, `datetime_`, `status_`
  - 索引: `venue.location_2dsphere` (地理位置索引)

- [ ] **applications** - 申请表
  - 索引: `slotId_`, `applicantId_`, `status_`

### 可以稍后创建（Phase 2）

- [ ] **reviews** - 用户评价表
- [ ] **venue_reviews** - 球场评价表
- [ ] **payment_settings** - 支付设置表
- [ ] **payment_records** - 支付记录表

---

## 3. 构建 npm（待完成）

在**微信开发者工具**中：

1. 点击顶部菜单 **工具** → **构建 npm**
2. 等待构建完成（会生成 `miniprogram_npm` 目录）
3. 重启开发者工具

---

## 4. 添加测试数据（可选但推荐）

### 4.1 创建测试球场

在 `venues` 集合中添加：

```json
{
  "name": "朝阳公园网球场",
  "location": {
    "type": "Point",
    "coordinates": [116.473963, 39.934253]
  },
  "address": {
    "province": "北京市",
    "city": "北京市",
    "district": "朝阳区",
    "detail": "朝阳公园内东侧"
  },
  "courts": {
    "total": 8,
    "indoor": false,
    "lighting": true
  },
  "rating": {
    "overall": 4.5,
    "count": 0
  },
  "status": "verified",
  "createdAt": { "$date": "2026-01-02T00:00:00.000Z" }
}
```

### 4.2 创建测试 Slot

在 `slots` 集合中添加：

```json
{
  "_openid": "test-openid",
  "sport": "网球",
  "datetime": { "$date": "2026-01-05T06:00:00.000Z" },
  "duration": 120,
  "venueId": "上面创建的球场ID",
  "venue": {
    "name": "朝阳公园网球场",
    "location": {
      "type": "Point",
      "coordinates": [116.473963, 39.934253]
    }
  },
  "requirement": {
    "simpleLevel": ["初级", "中级"],
    "needCount": 2
  },
  "currentCount": 0,
  "participants": [],
  "status": "open",
  "createdAt": { "$date": "2026-01-02T00:00:00.000Z" }
}
```

---

## 5. 验证配置

运行这段代码测试：

```javascript
// 在小程序的 app.js onLaunch 中或任意页面测试
const db = wx.cloud.database();

// 测试 1: 云函数是否可用
wx.cloud.callFunction({
  name: 'login',
  data: {},
  success: res => {
    console.log('✅ 云函数测试成功', res);
  },
  fail: err => {
    console.error('❌ 云函数测试失败', err);
  }
});

// 测试 2: 数据库是否可用
db.collection('venues').limit(1).get({
  success: res => {
    console.log('✅ 数据库测试成功', res);
  },
  fail: err => {
    console.error('❌ 数据库测试失败', err);
  }
});
```

---

## 6. 配置完成检查

确认以下都已完成：

- [ ] 云开发环境已开通
- [ ] 4个核心集合已创建（users, venues, slots, applications）
- [ ] 关键索引已添加（特别是地理位置索引）
- [ ] npm 已构建
- [ ] 测试数据已添加（至少1个球场）
- [ ] 验证代码运行成功

---

## 遇到问题？

### 问题 1: 云开发控制台打不开
**解决:** 检查网络，重启微信开发者工具

### 问题 2: 地理位置索引创建失败
**解决:** 确保 location 字段格式正确：
```json
{
  "type": "Point",
  "coordinates": [经度, 纬度]  // 注意顺序！
}
```

### 问题 3: npm 构建失败
**解决:**
1. 删除 `node_modules` 和 `package-lock.json`
2. 运行 `npm install`
3. 重新构建 npm

---

## 完成后告诉我

配置完成后，回复 "数据库配置完成"，我会继续实现云函数！🚀

# 数据库配置指南

## 步骤 1: 开通云开发环境

1. 打开**微信开发者工具**
2. 点击顶部菜单 **云开发** → **开通云开发**
3. 选择环境名称（如：`meetplayer-prod`）
4. 等待环境创建完成

## 步骤 2: 创建数据库集合

在**微信开发者工具** → **云开发控制台** → **数据库** 中，依次创建以下集合：

### 1. users（用户表）

**集合名称:** `users`

**索引配置:**
```json
[
  {
    "name": "_openid_",
    "unique": true,
    "keys": [{ "name": "_openid", "direction": "1" }]
  },
  {
    "name": "nickName_",
    "keys": [{ "name": "nickName", "direction": "1" }]
  }
]
```

**初始数据（可选）:**
```json
{
  "_openid": "示例-openid",
  "nickName": "测试用户",
  "avatarUrl": "https://thirdwx.qlogo.cn/mmopen/...",
  "gender": 1,
  "level": {
    "simple": "中级",
    "ntrp": 3.5,
    "verified": false,
    "lastUpdated": { "$date": "2026-01-02T00:00:00.000Z" }
  },
  "sports": ["网球"],
  "rating": 5.0,
  "totalGames": 0,
  "creditScore": 100,
  "location": null,
  "favoriteVenues": [],
  "createdAt": { "$date": "2026-01-02T00:00:00.000Z" }
}
```

---

### 2. venues（球场表）

**集合名称:** `venues`

**索引配置:**
```json
[
  {
    "name": "location_2dsphere",
    "type": "2dsphere",
    "keys": [{ "name": "location", "direction": "2dsphere" }]
  },
  {
    "name": "status_",
    "keys": [{ "name": "status", "direction": "1" }]
  },
  {
    "name": "rating.overall_",
    "keys": [{ "name": "rating.overall", "direction": "-1" }]
  }
]
```

**初始数据（示例）:**
```json
{
  "name": "朝阳公园网球场",
  "alias": ["Chaoyang Park Tennis"],
  "location": {
    "type": "Point",
    "coordinates": [116.473963, 39.934253]
  },
  "address": {
    "province": "北京市",
    "city": "北京市",
    "district": "朝阳区",
    "street": "农展南路1号",
    "detail": "朝阳公园内东侧"
  },
  "courts": {
    "total": 8,
    "types": {
      "hardCourt": 6,
      "clayCourt": 2,
      "grassCourt": 0
    },
    "indoor": false,
    "lighting": true
  },
  "facilities": {
    "locker": true,
    "shower": true,
    "parking": true,
    "equipment": true
  },
  "pricing": {
    "dayRate": { "min": 100, "max": 150 },
    "nightRate": { "min": 150, "max": 180 },
    "currency": "CNY"
  },
  "contact": {
    "phone": "010-12345678",
    "hours": "6:00-22:00"
  },
  "rating": {
    "overall": 4.5,
    "count": 0,
    "breakdown": {
      "courtQuality": 4.5,
      "facilities": 4.5,
      "cleanliness": 4.5,
      "value": 4.5
    }
  },
  "stats": {
    "slotsCount": 0,
    "viewCount": 0,
    "favoriteCount": 0
  },
  "photos": [],
  "status": "verified",
  "createdBy": "admin",
  "createdAt": { "$date": "2026-01-02T00:00:00.000Z" },
  "updatedAt": { "$date": "2026-01-02T00:00:00.000Z" }
}
```

---

### 3. slots（约球局表）

**集合名称:** `slots`

**索引配置:**
```json
[
  {
    "name": "_openid_",
    "keys": [{ "name": "_openid", "direction": "1" }]
  },
  {
    "name": "venueId_",
    "keys": [{ "name": "venueId", "direction": "1" }]
  },
  {
    "name": "datetime_",
    "keys": [{ "name": "datetime", "direction": "1" }]
  },
  {
    "name": "status_",
    "keys": [{ "name": "status", "direction": "1" }]
  },
  {
    "name": "venue.location_2dsphere",
    "type": "2dsphere",
    "keys": [{ "name": "venue.location", "direction": "2dsphere" }]
  }
]
```

**初始数据（可选）:**
```json
{
  "_openid": "示例-openid",
  "sport": "网球",
  "datetime": { "$date": "2026-01-05T06:00:00.000Z" },
  "duration": 120,
  "venueId": "venue_xxx",
  "venue": {
    "name": "朝阳公园网球场",
    "location": {
      "type": "Point",
      "coordinates": [116.473963, 39.934253]
    },
    "rating": 4.5,
    "address": "北京市朝阳区农展南路1号"
  },
  "requirement": {
    "simpleLevel": ["初级", "中级"],
    "ntrpMin": 2.5,
    "ntrpMax": 4.0,
    "gender": 0,
    "needCount": 2
  },
  "currentCount": 0,
  "participants": [],
  "status": "open",
  "note": "带水和毛巾",
  "paymentSettingId": null,
  "createdAt": { "$date": "2026-01-02T00:00:00.000Z" }
}
```

---

### 4. applications（申请表）

**集合名称:** `applications`

**索引配置:**
```json
[
  {
    "name": "slotId_",
    "keys": [{ "name": "slotId", "direction": "1" }]
  },
  {
    "name": "applicantId_",
    "keys": [{ "name": "applicantId", "direction": "1" }]
  },
  {
    "name": "status_",
    "keys": [{ "name": "status", "direction": "1" }]
  }
]
```

---

### 5. reviews（用户评价表）

**集合名称:** `reviews`

**索引配置:**
```json
[
  {
    "name": "slotId_",
    "keys": [{ "name": "slotId", "direction": "1" }]
  },
  {
    "name": "toUserId_",
    "keys": [{ "name": "toUserId", "direction": "1" }]
  }
]
```

---

### 6. venue_reviews（球场评价表）

**集合名称:** `venue_reviews`

**索引配置:**
```json
[
  {
    "name": "venueId_",
    "keys": [{ "name": "venueId", "direction": "1" }]
  },
  {
    "name": "userId_",
    "keys": [{ "name": "userId", "direction": "1" }]
  },
  {
    "name": "status_",
    "keys": [{ "name": "status", "direction": "1" }]
  },
  {
    "name": "createdAt_",
    "keys": [{ "name": "createdAt", "direction": "-1" }]
  }
]
```

---

### 7. payment_settings（支付设置表）

**集合名称:** `payment_settings`

**索引配置:**
```json
[
  {
    "name": "slotId_",
    "unique": true,
    "keys": [{ "name": "slotId", "direction": "1" }]
  }
]
```

---

### 8. payment_records（支付记录表）

**集合名称:** `payment_records`

**索引配置:**
```json
[
  {
    "name": "slotId_",
    "keys": [{ "name": "slotId", "direction": "1" }]
  },
  {
    "name": "payerId_",
    "keys": [{ "name": "payerId", "direction": "1" }]
  },
  {
    "name": "status_",
    "keys": [{ "name": "status", "direction": "1" }]
  }
]
```

---

## 步骤 3: 配置数据库权限

在**云开发控制台** → **数据库** → 每个集合的**权限设置**中：

### 开发阶段（推荐）

**所有集合暂时设置为:**
- **读权限:** 所有用户可读
- **写权限:** 所有用户可写

⚠️ **重要:** 上线前必须改为自定义权限！

### 生产环境（上线前必改）

#### users 集合
```javascript
// 读权限
{
  "read": true  // 所有用户可读（查看其他用户资料）
}

// 写权限
{
  "write": "doc._openid == auth.openid"  // 只能修改自己的资料
}
```

#### venues 集合
```javascript
// 读权限
{
  "read": "doc.status == 'verified'"  // 只显示已审核的球场
}

// 写权限
{
  "write": false  // 通过云函数创建，普通用户不能直接写
}
```

#### slots 集合
```javascript
// 读权限
{
  "read": true  // 所有人可浏览
}

// 写权限
{
  "write": "doc._openid == auth.openid"  // 只能修改自己发布的
}
```

#### applications 集合
```javascript
// 读权限
{
  "read": "doc.applicantId == auth.openid"  // 只能看自己的申请
}

// 写权限
{
  "write": "doc.applicantId == auth.openid"  // 只能操作自己的申请
}
```

其他集合类似配置。

---

## 步骤 4: 验证数据库配置

运行以下测试查询，确保配置正确：

```javascript
// 在微信开发者工具的调试器中测试
const db = wx.cloud.database();

// 测试 users 集合
db.collection('users').get().then(res => {
  console.log('users 集合测试成功', res);
});

// 测试 venues 集合（地理位置查询）
db.collection('venues')
  .where({
    location: db.command.geoNear({
      geometry: db.Geo.Point(116.473963, 39.934253),
      maxDistance: 5000
    })
  })
  .get()
  .then(res => {
    console.log('venues 地理位置查询测试成功', res);
  });
```

---

## 常见问题

### Q1: 地理位置索引创建失败？
**A:** 确保 location 字段格式为：
```json
{
  "type": "Point",
  "coordinates": [经度, 纬度]
}
```

### Q2: 如何批量导入数据？
**A:** 使用云开发控制台的**导入**功能，上传 JSON 或 CSV 文件。

### Q3: 索引创建后多久生效？
**A:** 通常 1-2 分钟，数据量大时可能需要更长时间。

---

## 下一步

数据库配置完成后：
1. ✅ 返回告诉 Claude "数据库配置完成"
2. 🚀 开始实现云函数

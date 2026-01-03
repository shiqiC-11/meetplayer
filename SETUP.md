# MeetPlayer 项目设置指南

本文档帮助你快速设置和运行 MeetPlayer 项目。

## 前置条件

### 1. 工具安装

- [x] 微信开发者工具（最新稳定版）
- [x] Node.js（v14.0 或以上）
- [x] npm 或 yarn

### 2. 账号准备

- [x] 微信小程序账号
- [x] 云开发权限

## 项目初始化步骤

### Step 1: 克隆项目并安装依赖

```bash
cd meetplayer
npm install
```

### Step 2: 配置微信开发者工具

1. 打开微信开发者工具
2. 扫码登录
3. 导入项目：
   - 项目目录：选择 `meetplayer` 文件夹
   - AppID：输入你的小程序 AppID（或使用测试号）
   - 项目名称：MeetPlayer

### Step 3: 构建 npm 包

在微信开发者工具中：

1. 点击菜单栏：**工具** → **构建 npm**
2. 等待构建完成（会生成 `miniprogram_npm` 目录）

> ⚠️ 如果构建失败，检查 `project.config.json` 中的 `miniprogramRoot` 配置

### Step 4: 开通云开发

1. 在微信开发者工具中，点击顶部的 **云开发** 按钮
2. 根据提示开通云开发
3. 创建云开发环境：
   - 环境名称：`dev`（开发环境）或 `prod`（生产环境）
   - 点击**创建**

### Step 5: 配置云开发环境 ID

编辑 `app.js` 文件，替换云开发环境 ID：

```javascript
wx.cloud.init({
  env: 'your-env-id-here', // 👈 替换为你的云开发环境 ID
  traceUser: true
});
```

> 💡 **如何获取环境 ID？**
>
> 在微信开发者工具中，点击 **云开发** → **设置** → 查看**环境 ID**

### Step 6: 创建数据库集合

在微信开发者工具的**云开发控制台**中，创建以下集合：

1. 点击 **数据库** 标签
2. 点击 **+** 创建集合
3. 依次创建以下集合：

| 集合名称 | 描述 |
|---------|------|
| `users` | 用户信息表 |
| `venues` | 球场信息表 |
| `slots` | 约球局表 |
| `applications` | 申请表 |
| `reviews` | 用户评价表 |
| `venue_reviews` | 球场评价表 |
| `payment_records` | 支付记录表 |
| `payment_settings` | 支付设置表 |

> 💡 **建议：** 为高频查询字段建立索引，如：
> - `venues` 集合的 `location` 字段（地理位置索引）
> - `slots` 集合的 `venueId`、`datetime`、`status` 字段

### Step 7: 部署云函数

目前项目中云函数文件夹还是空的，后续开发时需要：

1. 在 `cloudfunctions` 目录下创建云函数文件夹
2. 右键点击云函数文件夹
3. 选择 **上传并部署：云端安装依赖**

**第一批需要创建的云函数：**
- `login` - 用户登录
- `updateUserProfile` - 更新用户信息
- `getNearbySlots` - 获取附近的约球局
- `getNearbyVenues` - 获取附近的球场

### Step 8: 配置权限

在 `app.json` 中已配置地理位置权限，但需要在**微信公众平台**后台设置：

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入 **开发** → **开发管理** → **接口设置**
3. 开启以下接口权限：
   - 获取用户位置（scope.userLocation）
   - 选择位置（chooseLocation）

### Step 9: 添加图标资源

项目需要以下图标和图片，请参考 `assets/README.md`：

**必需的图标：**
- TabBar 图标（3组，每组2个状态）
- 地图标记图标
- Logo 图片

**创建占位图标的快速方法：**

使用在线工具创建简单的占位图标，或使用 Figma/Sketch 设计后导出。

### Step 10: 运行项目

1. 点击微信开发者工具顶部的 **编译** 按钮
2. 在模拟器中查看效果
3. 或点击 **预览** 按钮，用手机扫码真机预览

## 常见问题排查

### Q1: npm 构建失败

**可能原因：**
- `package.json` 配置错误
- `project.config.json` 中的 `miniprogramRoot` 路径不正确

**解决方法：**
```json
// project.config.json
{
  "miniprogramRoot": "./",
  "setting": {
    "packNpmManually": false,
    "packNpmRelationList": []
  }
}
```

### Q2: 云函数调用失败

**可能原因：**
- 云开发环境 ID 未正确配置
- 云函数未部署
- 网络问题

**解决方法：**
1. 检查 `app.js` 中的环境 ID
2. 确认云函数已上传并部署
3. 在云开发控制台查看云函数日志

### Q3: 地图不显示

**可能原因：**
- 未开通地理位置权限
- 坐标格式错误

**解决方法：**
1. 检查是否授权了位置权限
2. 确认使用 GCJ-02 坐标系（国测局坐标）

### Q4: Vant 组件不显示

**可能原因：**
- npm 未构建
- 组件路径配置错误

**解决方法：**
1. 重新构建 npm
2. 检查 `app.json` 中的组件路径：
```json
{
  "usingComponents": {
    "van-button": "@vant/weapp/button/index"
  }
}
```

## 开发建议

### 推荐的开发顺序

1. ✅ **Phase 1: 基础框架**（已完成）
   - 项目结构搭建
   - 登录功能
   - 个人中心

2. **Phase 2: 核心功能**（下一步）
   - 首页地图/列表展示
   - 发布约球功能
   - Slot 详情页

3. **Phase 3: 完善功能**
   - 球场系统
   - 申请和审核流程
   - 支付分摊

4. **Phase 4: 优化和测试**
   - 性能优化
   - 错误处理
   - 全面测试

### 开发工作流

1. 创建功能分支：`git checkout -b feature/xxx`
2. 开发并测试
3. 提交代码：`git commit -m "feat: xxx"`
4. 合并到主分支：`git merge feature/xxx`

### 代码提交规范

使用约定式提交（Conventional Commits）：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具链相关

## 下一步行动

现在基础框架已搭建完成，建议按以下顺序继续开发：

### 1. 创建云函数（优先）

```bash
# 在 cloudfunctions 目录下
mkdir login updateUserProfile getNearbySlots getNearbyVenues
```

### 2. 实现首页功能

- [ ] 完善地图展示
- [ ] 实现列表模式
- [ ] 添加筛选功能

### 3. 实现发布功能

- [ ] 球场选择器组件
- [ ] 时间选择
- [ ] 发布表单

### 4. 测试和优化

- [ ] 单元测试
- [ ] 性能测试
- [ ] 真机测试

## 需要帮助？

- 查看 [CLAUDE.md](./CLAUDE.md) - 详细的开发指南
- 查看 [PRD.md](./PRD.md) - 产品需求文档
- 查看 [README.md](./README.md) - 项目说明

---

**文档版本：** v1.0
**最后更新：** 2026-01-01

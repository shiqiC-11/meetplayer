# 🚀 约球小程序 - Claude Code 快速启动

## 第一次运行

### 1. 环境检查

```bash
# 检查 Node.js
node --version  # 应该是 v18+

# 检查 Claude Code
claude --version

# 检查微信开发者工具是否安装
# macOS: /Applications/wechatwebdevtools.app
# Windows: C:\Program Files (x86)\Tencent\微信web开发者工具
```

### 2. 初始化项目

```bash
# 进入项目目录
cd meetplayer

# 安装依赖
npm install

# 构建 Vant Weapp（在微信开发者工具中）
# 工具 → 构建 npm
```

### 3. 配置小程序 AppID

编辑 `project.config.json`，替换 `appid` 为你的小程序 AppID：

```json
{
  "appid": "wxXXXXXXXXXXXXXXXX"
}
```

### 4. 启动开发

```bash
# 方式 1: 使用 Claude Code（推荐）
claude "初始化微信小程序项目，创建基础页面结构"

# 方式 2: 手动在微信开发者工具中打开项目
# 工具 → 导入项目 → 选择当前目录
```

---

## 使用 Claude Code 开发

### 第一周：MVP 核心功能

#### Day 1-2: 基础框架

```bash
# 初始化项目结构
claude "创建微信小程序基础结构：
- pages: index, publish, slot-detail, my
- components: slot-card, venue-card
- utils: api.js, auth.js, geo.js
- cloudfunctions: 云函数目录
配置 app.json 和全局样式"

# 实现用户登录
claude "实现用户登录流程：
1. 在 app.js 中实现 wx.login() 和云函数 login
2. 创建 pages/login 页面
3. 实现用户授权和个人资料保存到云数据库 users 表"
```

#### Day 3-4: 发布 Slot

```bash
claude "实现发布 Slot 功能：
1. 创建 pages/publish 页面
2. 实现球场选择器组件（搜索已有球场 + 创建新球场）
3. 实现时间选择、等级选择、费用设置
4. 创建云函数 create_slot 和 create_venue
5. 实现球场智能匹配算法"
```

#### Day 5-6: 首页和浏览

```bash
claude "实现首页地图和列表视图：
1. 创建 pages/index 页面
2. 实现地图视图（按球场聚合显示 Slots）
3. 实现列表视图（时间排序）
4. 创建云函数 get_venues_with_slots
5. 实现筛选功能（时间、距离、等级）"
```

#### Day 7: Slot 详情和申请

```bash
claude "实现 Slot 详情和申请流程：
1. 创建 pages/slot-detail 页面
2. 显示完整的 Slot 信息和 Host 资料
3. 实现申请按钮和留言功能
4. 创建云函数 apply_slot
5. Host 审核申请功能（通过/拒绝）"
```

### 第二周：完善功能

#### Day 8-9: 支付分摊

```bash
claude "实现支付分摊功能（MVP 简化版）：
1. 在 publish 页面添加费用设置
2. 实现支付设置保存（payment_settings 表）
3. 申请通过后显示付款引导
4. Host 收款管理页面
5. 手动确认收款功能"
```

#### Day 10-11: 球场系统

```bash
claude "完善球场系统：
1. 创建 pages/venue-detail 页面
2. 显示球场详情、照片、评价
3. 显示该球场的所有 Slots
4. 实现球场评价功能（venue_reviews 表）
5. 实现球场照片上传"
```

#### Day 12: 个人中心

```bash
claude "实现个人中心和我的 Slots：
1. 完善 pages/my 页面
2. 创建 pages/my-slots 页面
3. 显示我发布的和参加的 Slots
4. 实现消息通知列表
5. 实现设置页面"
```

#### Day 13-14: 测试和优化

```bash
claude "优化性能和用户体验：
1. 添加所有页面的加载状态
2. 完善错误处理和用户提示
3. 优化列表加载（分页）
4. 测试所有功能，修复 bugs
5. 准备隐私政策和用户协议"
```

---

## 常用 Claude Code 命令

### 创建新功能

```bash
# 通用格式
claude "创建 [功能名称]，包括：
1. [具体步骤 1]
2. [具体步骤 2]
3. [具体步骤 3]"

# 示例
claude "创建球场评价功能，包括：
1. 在 venue-detail 页面添加"写评价"按钮
2. 创建评价表单（评分、标签、文字、照片）
3. 提交到云函数 submit_review
4. 更新球场评分统计"
```

### 修复 Bug

```bash
# 通用格式
claude "修复 [bug 描述]：
[具体问题]
预期行为：[...]
实际行为：[...]"

# 示例
claude "修复地图标记点击无响应的问题：
在 pages/index 中，点击地图标记时没有弹出球场卡片
预期：点击后弹出底部抽屉显示球场信息
实际：点击没有任何反应"
```

### 优化代码

```bash
claude "优化 [文件/功能]：
1. 改进性能
2. 添加错误处理
3. 优化用户体验"

# 示例
claude "优化首页加载性能：
1. 添加骨架屏加载状态
2. 实现分页加载 Slots
3. 缓存球场数据避免重复请求"
```

### 调试和解释

```bash
# 查看代码
claude "解释 cloudfunctions/create_slot/index.js 的逻辑"

# 调试问题
claude "为什么云函数 apply_slot 返回错误？检查权限和数据格式"
```

---

## 关键检查点

### ✅ Day 2 检查点
- [ ] 项目可以在微信开发者工具中打开
- [ ] 用户登录流程正常
- [ ] 可以保存用户信息到云数据库

### ✅ Day 7 检查点
- [ ] 可以发布 Slot
- [ ] 可以在地图上看到 Slots（按球场聚合）
- [ ] 可以申请加入 Slot
- [ ] Host 可以审核申请

### ✅ Day 12 检查点
- [ ] 支付分摊流程通畅
- [ ] 球场详情页显示正常
- [ ] 可以提交球场评价
- [ ] 个人中心功能完整

### ✅ Day 14 检查点
- [ ] 所有功能测试通过
- [ ] 性能优化完成
- [ ] 错误处理完善
- [ ] 准备好提交微信审核

---

## 遇到问题？

### 问题 1: Claude Code 无法连接

```bash
# 检查 API Key
claude config

# 重新登录
claude login
```

### 问题 2: 云函数调用失败

```bash
# 检查云函数是否已上传
# 在微信开发者工具 → 云开发 → 云函数

# 查看云函数日志
# 云开发 → 运维中心 → 云函数日志
```

### 问题 3: 依赖安装失败

```bash
# 清除缓存重新安装
rm -rf node_modules miniprogram_npm
npm install

# 重新构建 npm
# 在微信开发者工具：工具 → 构建 npm
```

---

## 下一步

准备好了吗？开始你的第一个命令：

```bash
claude "根据 CLAUDE.md 和 PRD.md，初始化微信小程序项目，创建完整的目录结构和基础文件"
```

🚀 祝开发顺利！
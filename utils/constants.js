// constants.js - 常量定义

// 等级映射
export const LEVEL_MAPPING = {
  "新手": {
    ntrpMin: 1.0,
    ntrpMax: 2.0,
    description: "刚开始学，还不太会打",
    example: "正在学习握拍和基础击球"
  },
  "初级": {
    ntrpMin: 2.5,
    ntrpMax: 3.0,
    description: "能连续对打，但不稳定",
    example: "能慢速对拉 5-10 拍"
  },
  "中级": {
    ntrpMin: 3.5,
    ntrpMax: 4.0,
    description: "能打比赛，有基本战术",
    example: "能参加业余比赛"
  },
  "高级": {
    ntrpMin: 4.5,
    ntrpMax: 5.0,
    description: "参加过正式比赛，技术全面",
    example: "俱乐部主力水平"
  },
  "专业": {
    ntrpMin: 5.5,
    ntrpMax: 7.0,
    description: "职业或准职业水平",
    example: "专业运动员"
  }
};

// 简化等级列表
export const SIMPLE_LEVELS = ["新手", "初级", "中级", "高级", "专业"];

// NTRP 等级列表
export const NTRP_LEVELS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0];

// 性别选项
export const GENDER_OPTIONS = [
  { label: "不限", value: 0 },
  { label: "仅男", value: 1 },
  { label: "仅女", value: 2 }
];

// Slot 状态
export const SLOT_STATUS = {
  OPEN: 'open',           // 招募中
  FULL: 'full',           // 已满员
  CLOSED: 'closed',       // 已关闭
  CANCELLED: 'cancelled', // 已取消
  COMPLETED: 'completed'  // 已完成
};

// Slot 状态显示文本
export const SLOT_STATUS_TEXT = {
  open: '招募中',
  full: '已满员',
  closed: '已关闭',
  cancelled: '已取消',
  completed: '已完成'
};

// 申请状态
export const APPLICATION_STATUS = {
  PENDING: 'pending',     // 待审核
  APPROVED: 'approved',   // 已通过
  REJECTED: 'rejected',   // 已拒绝
  PAID: 'paid',          // 已付款
  CONFIRMED: 'confirmed'  // 已确认
};

// 申请状态显示文本
export const APPLICATION_STATUS_TEXT = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  paid: '已付款',
  confirmed: '已确认'
};

// 距离筛选选项
export const DISTANCE_OPTIONS = [
  { label: '1km', value: 1000 },
  { label: '3km', value: 3000 },
  { label: '5km', value: 5000 },
  { label: '10km', value: 10000 }
];

// 时间筛选选项
export const TIME_OPTIONS = [
  { label: '今天', value: 'today' },
  { label: '明天', value: 'tomorrow' },
  { label: '本周', value: 'thisWeek' },
  { label: '自定义', value: 'custom' }
];

// 评价标签
export const REVIEW_TAGS = {
  positive: ['守时', '球技好', '友好', '专业', '好相处', '值得推荐'],
  negative: ['爽约', '迟到', '态度差', '技术不符', '不友好']
};

// 球场评价标签
export const VENUE_TAGS = {
  positive: ['场地好', '有灯光', '交通方便', '设施完善', '环境好', '性价比高'],
  negative: ['价格贵', '人太多', '设施陈旧', '交通不便', '卫生差']
};

// 场地类型
export const COURT_TYPES = {
  HARD: 'hardCourt',
  CLAY: 'clayCourt',
  GRASS: 'grassCourt'
};

// 场地类型显示文本
export const COURT_TYPES_TEXT = {
  hardCourt: '硬地',
  clayCourt: '红土',
  grassCourt: '草地'
};

// 运动类型（MVP 仅网球）
export const SPORT_TYPES = ['网球'];

// 默认地图中心（伦敦，英国）
export const DEFAULT_MAP_CENTER = {
  latitude: 51.5074,  // 伦敦纬度
  longitude: -0.1278  // 伦敦经度
};

// 地图缩放级别
export const MAP_SCALE = 13;

// 每页数据数量
export const PAGE_SIZE = 20;

// 最大上传图片数量
export const MAX_IMAGES = 9;

// 图片上传大小限制（MB）
export const MAX_IMAGE_SIZE = 5;

// 支付方式
export const PAYMENT_METHODS = {
  FREE: 'free',
  WECHAT_TRANSFER: 'wechat_transfer',
  WECHAT_PAY: 'wechat_pay'
};

// 支付方式显示文本
export const PAYMENT_METHOD_TEXT = {
  free: '免费',
  wechat_transfer: '微信转账',
  wechat_pay: '微信支付'
};

// 取消时间限制（小时）
export const CANCEL_TIME_LIMIT = {
  FULL_REFUND: 24,  // 24小时以上全额退款
  HALF_REFUND: 2,   // 2-24小时半额退款
  NO_REFUND: 0      // 2小时内不可退款
};

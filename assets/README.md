# Assets 目录说明

## 目录结构

```
assets/
├── images/              # 图片资源
│   ├── logo.png        # 应用 Logo
│   ├── default-avatar.png  # 默认头像
│   └── ...
└── icons/              # 图标资源
    ├── nearby.png      # 附近图标
    ├── nearby-active.png  # 附近图标（激活）
    ├── slots.png       # 约球图标
    ├── slots-active.png   # 约球图标（激活）
    ├── profile.png     # 个人中心图标
    ├── profile-active.png # 个人中心图标（激活）
    ├── venue-marker.png   # 球场地图标记
    └── location.png    # 定位图标
```

## 图标尺寸建议

- TabBar 图标：81px × 81px
- 地图标记：40px × 40px
- 小图标：32px × 32px

## 图片格式

- 推荐使用 PNG 格式（支持透明背景）
- Logo 建议提供 @2x 和 @3x 版本

## 注意事项

1. 所有图标需要提供普通和激活两种状态
2. 图片大小尽量压缩，建议不超过 100KB
3. 使用有意义的文件名，便于维护
4. 如果使用图标字体，可以在这里说明

## TODO

- [ ] 添加应用 Logo
- [ ] 添加 TabBar 图标
- [ ] 添加地图标记图标
- [ ] 添加默认头像图片
- [ ] 添加其他必要的图标和图片

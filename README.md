# 焦糖2048 🍬

> 一款带有焦糖糖浆质感的微信小程序版 2048 游戏

![License](https://img.shields.io/badge/license-MIT-blue)

---

## 预览效果

| 游戏界面 | 统计区 | 破纪录特效 |
|:---:|:---:|:---:|
| 熔岩暗黑背景 + 焦糖浆方块 | 实时/效率/历史三组统计 | 2秒礼花庆祝 |

---

## 特色功能

### 🎨 视觉风格
- **熔岩暗黑**主题配色，深色背景衬托焦糖色方块
- **焦糖糖浆覆盖**质感：每个方块都有光泽渐变层和顶部反光线
- **七段数码管 LCD 字体**（DSEG7 Classic Bold），经典电子显示风格
- **合并数字跳动动画**：合并时数字弹跳，配合方块缩放，反馈灵动
- **"焦糖2048" LOGO**：两行大方块设计，与游戏方块风格统一
- **破纪录礼花特效**：2秒粒子爆发特效庆祝新纪录

### 🔊 音效系统
- 滑动音效（轻微）
- 合并音效（清脆柔和）
- 胜利庆祝音效
- 游戏结束音效
- 自动绕过系统静音开关

### 📊 统计信息（9:16 屏幕适配）
- **实时动态**：步数、最大方块、合并次数、游戏用时
- **效率指标**：场均得分、最大单次合并得分
- **历史记录**：总局数、通关次数、历史最高分

---

## 如何使用 / 运行方法

### 1. 下载项目

方式一：Git 克隆
```bash
git clone https://github.com/joshua76y/caramel-2048.git
```

方式二：直接下载 ZIP
- 打开 https://github.com/joshua76y/caramel-2048
- 点击 `Code` → `Download ZIP`
- 解压到本地

### 2. 导入微信开发者工具

1. 打开 **[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)**
2. 点击 **导入项目**（或 `文件` → `导入项目`）
3. 选择项目目录：
   - **项目目录**：选择刚才下载的 `caramel-2048` 文件夹
   - **AppID**：使用你自己的小程序 AppID，或使用测试号
   - **后端服务**：不使用云服务
4. 点击 **确定**

### 3. 运行

导入后开发者工具会自动编译运行，在模拟器中即可看到游戏界面。

### 4. 真机预览

- 在开发者工具中点击工具栏的 **预览** 按钮
- 用微信扫描生成的二维码
- 即可在手机上畅玩

---

## 项目结构

```
caramel-2048/
├── app.js                    # 小程序入口
├── app.json                  # 全局配置
├── app.wxss                  # 全局样式
├── project.config.json       # 项目配置
├── sitemap.json              # 站点地图
├── package.json              # 依赖管理
├── README.md                 # 本文件
├── LICENSE                   # MIT 许可证
│
├── audio/                    # 音效文件
│   ├── move.wav              # 滑动音效
│   ├── slide.wav             # 滑动辅助音效
│   ├── merge.wav             # 合并清脆音效
│   ├── gameover.wav          # 游戏结束音效
│   └── win.wav               # 胜利庆祝音效
│
├── fonts/                    # 字体文件
│   └── DSEG7Classic-Bold.woff2  # 七段数码管 LCD 字体
│
├── pages/
│   └── index/
│       ├── index.js          # 游戏页面逻辑（滑动、动画、音效、计时）
│       ├── index.json        # 页面配置
│       ├── index.wxml        # 页面模板（LOGO、棋盘、遮罩、统计区）
│       └── index.wxss        # 页面样式（暗黑主题、糖浆效果、LCD字体、动画）
│
└── utils/
    └── game.js               # 2048 核心引擎（算法、状态管理、统计）
```

---

## 技术要点

| 技术 | 说明 |
|------|------|
| **框架** | 微信小程序原生框架 |
| **字体** | DSEG7 Classic Bold（通过 `@font-face` base64 内嵌） |
| **音效** | `wx.createInnerAudioContext()` + `obeyMuteSwitch=false` |
| **动画** | CSS `transition` 滑动 + `@keyframes` 弹跳/缩放 |
| **存储** | `wx.setStorageSync` 保存最高分和历史统计 |
| **配色** | 熔岩暗黑 + 焦糖琥珀色系渐变 |

---

## 作者

**焦糖铁观音** @2026

---

## 许可证

[MIT](./LICENSE)

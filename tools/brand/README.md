# 品牌资源（图标 / 启动页）

设计源只有一个：`logo.svg`。所有 PNG 与安卓 XML 都由 `generate.mjs` 生成，可重复执行，改设计只需改 SVG 后重跑。

## 命令

```
node tools/brand/generate.mjs
```

依赖：Node.js 22+ 与 headless Chromium。Chromium 按 `CHROME_PATH` 环境变量 → `PATH` → `%LOCALAPPDATA%/ms-playwright`（或 `~/.cache/ms-playwright`）派生目录依次探测，找不到会明确报错退出。不需要额外图像库。

## 设计规范

- 背景：`#5A4836` 深可可（与 `theme_color` 一致）。
- 图形：暖白 `#F7EFE4` 线性水滴（描边，不填充），底部一道浅弧暗示碗沿，不放任何文字。
- 线宽为画布的 5%（碗弧 4%），48px 下主轮廓约 2.4px，仍可辨认。

## 产物去向

| 产物 | 位置 | 说明 | 入库 |
|---|---|---|---|
| 方形启动图标 | `android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png` | 48 / 72 / 96 / 144 / 192 | 是 |
| 圆形启动图标 | 同目录 `ic_launcher_round.png` | 同尺寸，圆外透明 | 是 |
| adaptive 前景 | 同目录 `ic_launcher_foreground.png` | 108 / 162 / 216 / 324 / 432；图形在中间 **66%** 安全区（`viewBox -25 -25 150 150`） | 是 |
| adaptive 背景色 | `values/ic_launcher_background.xml` | `#5A4836` | 是 |
| adaptive 结构 | `mipmap-anydpi-v26/ic_launcher.xml`、`ic_launcher_round.xml` | 保持原 adaptive 引用不变 | 是 |
| 备用 vector | `drawable/ic_launcher_background.xml`、`drawable-v24/ic_launcher_foreground.xml` | 已替换 Capacitor 默认绿色网格与机器人图形 | 是 |
| 启动页 | `drawable-{port,land}-*/splash.png`、`drawable/splash.png` | 沿用原尺寸，纯背景 + 居中 Logo（约屏宽 30%） | 是 |
| PWA 图标 | `icon.png`(512)、`icon-192.png`、`icon-512.png`、`icon-512-maskable.png`、`apple-touch-icon.png`(180) | `manifest.webmanifest` 已补齐 icons | 是 |
| 商店图标 | `tools/brand/out/store-icon-512.png`、`store-icon-216.png` | 华为 216 / 通用 512 | 否 |
| 48px 预览 | `tools/brand/out/preview-48px.png` | 方形 / 圆形 / 前景的原尺寸与 ×4 放大 | 否 |
| 桌面 / 启动页模拟预览 | `tools/brand/out/preview-device-mock.png` | 仿桌面方形+圆形图标、仿手机启动页；**本地模拟，不是真机截图** | 否 |

`tools/brand/out/` 已加入根 `.gitignore`，属交付产物，随时可重建。

## Capacitor assets 目录怎么来的

`android/app/src/main/assets/public/` 被 `android/.gitignore` 忽略，**不入库**，也不应手工编辑。正确链路：

```
node tools/brand/generate.mjs       # 更新项目根 PWA 图标与 manifest
npm run build:app                   # 复制到 www/
npx cap sync android                # 复制到 assets/public/
```

`scripts/build-android-assets.mjs` 的复制清单已包含 5 个 PWA 图标，因此 `assets/public/icon.png` 等会随构建自动带上新品牌图。

## 验收要点

- 全密度尺寸按上表；`mtime` 应全部晚于 Capacitor 模板基线（旧默认图统一为 1793204306）。
- 不残留默认蓝色交叉图标 / 绿色网格 / 机器人 vector。
- `node --check` 需逐文件循环，不能把通配符一次性传给 `node --check`。
- 真机 / 模拟器的桌面图标（方形、圆形）与启动页截图需由主人在设备上补；本目录的 `preview-48px.png` 只是本地渲染预览，**不能替代真机截图**。

# 品牌资源（图标 / 启动页）

**视觉唯一源**：`design-demos/final/`（主人 2026-11-16 21:45 选定的 dir-2 终版：米白水滴偏左 + 绿色对勾压右下、深可可底、无文字）。终版只有 PNG，没有可复用 SVG 路径数据，因此 `generate.mjs` 用 Chromium CDP 管线把终版 PNG 以 data URI 嵌入后按目标尺寸缩放输出；`logo.svg`（早期 A 方案线描水滴 + 弧线）**已废弃、不再参与生成**。所有 PNG 与安卓 XML 可重复生成，改视觉只需替换 `design-demos/final/` 后重跑。

## 命令

```
node tools/brand/generate.mjs
```

依赖：Node.js 22+ 与 headless Chromium。Chromium 按 `CHROME_PATH` 环境变量 → `PATH` → `%LOCALAPPDATA%/ms-playwright`（或 `~/.cache/ms-playwright`）派生目录依次探测，找不到会明确报错退出。不需要额外图像库。

## 设计规范

- 背景：`#5A4836` 深可可（与 `theme_color` 一致）。
- 图形：米白 `#F6F2EC` 水滴偏左、绿色 `#2E7D4F` 对勾压右下，纯几何平涂、无描边、无渐变、无文字。
- adaptive foreground 使用终版透明前景 `ic_launcher_foreground.png`，自带安全留白；实测不透明像素外接框占画布 **15.03%**（宽 38.87% / 高 38.67%），低于 61% 上限。证据在 `tools/brand/out/foreground-safe-area.json`。

## 产物去向

| 产物 | 位置 | 说明 | 入库 |
|---|---|---|---|
| 方形启动图标 | `android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png` | 48 / 72 / 96 / 144 / 192 | 是 |
| 圆形启动图标 | 同目录 `ic_launcher_round.png` | 同尺寸，圆外透明 | 是 |
| adaptive 前景 | 同目录 `ic_launcher_foreground.png` | 108 / 162 / 216 / 324 / 432；透明底，内容外接框占比 15.03% | 是 |
| adaptive 背景色 | `values/ic_launcher_background.xml` | `#5A4836` | 是 |
| adaptive 结构 | `mipmap-anydpi-v26/ic_launcher.xml`、`ic_launcher_round.xml` | 保持 adaptive 引用 `@mipmap/ic_launcher_foreground` 不变 | 是 |
| 备用 vector | `drawable/ic_launcher_background.xml`、`drawable-v24/ic_launcher_foreground.xml` | 背景为深可可；前景 vector 为透明占位，避免旧 A 方案线描水滴 + 弧线残留 | 是 |
| 启动页 | `drawable-{port,land}-*/splash.png`、`drawable/splash.png` | 沿用原尺寸，纯背景 + 居中终版图标（约屏宽 30%），无文字 | 是 |
| PWA 图标 | `icon.png`(512)、`icon-192.png`、`icon-512.png`、`icon-512-maskable.png`、`apple-touch-icon.png`(180) | `manifest.webmanifest` 已补齐 icons | 是 |
| 商店图标 | `tools/brand/out/store-icon-512.png`、`store-icon-216.png` | 华为 216 / 通用 512 | 否 |
| 48px 预览 | `tools/brand/out/preview-48px.png` | 方形 / 圆形 / 前景的原尺寸与 ×4 放大 | 否 |
| 60 / 120px 预览 | `tools/brand/out/preview-60-120.png` | 产物 60px、终版 120px、60px ×4 放大 | 否 |
| 启动页新旧对比 | `tools/brand/out/preview-splash-compare.png` | 旧 A 方案线描 vs 新 dir-2 终版 | 否 |
| 安全区证据 | `tools/brand/out/foreground-safe-area.json` | 外接框坐标、面积/宽/高占比与 0.61 上限判定 | 否 |
| 桌面 / 启动页模拟预览 | `tools/brand/out/preview-device-mock.png` | 仿桌面方形+圆形图标、仿手机启动页；**本地模拟，不是真机截图** | 否 |

`tools/brand/out/` 已加入根 `.gitignore`，属交付产物，随时可重建。

## Capacitor assets 目录怎么来的

`android/app/src/main/assets/public/` 被 `android/.gitignore` 忽略，**不入库**，也不应手工编辑。正确链路：

```
node tools/brand/generate.mjs       # 更新项目根 PWA 图标与 manifest
npm run build:app                   # 复制到 www/
npx cap sync android                # 复制到 assets/public/
```

`scripts/build-android-assets.mjs` 的复制清单已包含 5 个 PWA 图标，因此 `assets/public/icon.png` 等会随构建自动带上终版品牌图；生成后应逐文件比对 `assets/public/` 与项目根同名文件的 SHA-256。

## 验收要点

- 全密度尺寸按上表；不得再用 A 方案的线描水滴 + 弧线，`generate.mjs` 不再引用 `logoInner`。
- 不残留默认蓝色交叉图标 / 绿色网格 / 机器人 vector。
- 前景安全区实测见 `foreground-safe-area.json`，`pass` 必须为 `true`。
- `node --check` 需逐文件循环，覆盖 `js/*.js`、`scripts/*.mjs`、`tools/**/*.mjs`，不能把通配符一次性传给 `node --check`。
- 真机 / 模拟器的桌面图标（方形、圆形）与启动页截图需由主人在设备上补；本地 `preview-*.png` **不能替代真机截图**。

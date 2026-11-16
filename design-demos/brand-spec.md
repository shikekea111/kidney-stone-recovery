# 能吃吗 · Brand Spec

> 采集日期：2026-11-16
> 资产来源：用户本地项目 `F:\能吃吗`（源码 css/styles.css、index.html、manifest.webmanifest、icon.png）
> 资产完整度：完整（自有数字产品，所有资产来自项目本身，无需外搜）

## 核心资产

### Logo / 图标
- 现用：`F:\能吃吗\icon.png`（512×512，深可可底 + 米白水滴 + 绿勾）
- 旧版备份：`.workbuddy\design\icon-v1.png`
- 使用场景：PWA 图标、Android 桌面图标、Apple touch icon
- 本次三方向优化候选：`design-demos/dir-2.png`、`dir-5.png`、`dir-7.png`

### UI 截图
- 数据源：`F:\能吃吗\css\styles.css`（完整设计系统）、`js/app.js`（全部页面由字符串模板渲染）
- 主色与语义色均从 CSS 变量抽取，见下方色板

### 色板（取自 css/styles.css :root）
- Brand primary: `#5a4836`（深可可，中性主色，退到背景层）
- Background: `#f7f5f1`（暖白）
- Cream: `#f6f2ec`（浅品牌色，图标用米白）
- Avoid 忌口: `#c0392b`（语义红）
- Limit 适量: `#b8791a`（语义琥珀）
- OK 可吃: `#2e7d4f`（语义绿）
- 规则：品牌色降饱和，语义色是页面唯一高饱和色

## 签名细节

- 水滴＝饮水记录，对勾＝可吃判定，两者是产品独有的视觉语言
- 图标为纯几何、无文字、无渐变、无描边装饰（商店小尺寸下文字不可读）

## 禁区

- 不用 emoji 当图标（上一版已全部换成统一线性 SVG）
- 不用渐变和光晕（v4 改版已去除）
- 不用紫色系、不用高饱和品牌橙（会和「适量」琥珀撞色）
- 六方向里「汉字吃」因认不出字已淘汰，不进入终选

## 气质关键词

- 可信、克制、清楚、健康、判定感

## 备注

- 现实参照方向（Apple 健康圆环 / Material 食物图标）因本机缺 Playwright 无法截图核实，方向卡已标注「未亲眼看到」，不假装看过。

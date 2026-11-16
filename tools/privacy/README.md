# 隐私政策：文本源与生成/验收工具

隐私政策的**唯一文本源**是 `privacy-source.txt`。网页、App 内片段、App 数据文件、上传用 zip 全部由它生成，避免多处手工同步导致内容不一致。本目录已入库，clone 仓库后即可完整复现。

## 命令（在项目根目录执行）

```
node tools/privacy/build-privacy.mjs            # 生成全部产物
node tools/privacy/verify-privacy.mjs           # 文本/静态资源/zip 验收（15 项）
node tools/privacy/verify-privacy-ui.mjs        # 首启弹窗参数化验收（19 项）
node tools/privacy/verify-privacy-browser.mjs   # 真实浏览器 CDP 零外部请求验收
node --check js/*.js scripts/*.mjs tools/privacy/*.mjs
```

`build-privacy.mjs` 可重复执行；删掉 `tools/privacy/out/` 后重跑即可完整重建，无需任何手工步骤。

## 产物去向

| 产物 | 路径 | 是否入库 | 用途 |
|---|---|---|---|
| 隐私政策网页 | `tools/privacy/out/index.html` | 否（out/ 已忽略） | Cloudflare Pages 页面 |
| 上传包 | `tools/privacy/out/privacy-site.zip` | 否 | zip 内仅根级 `index.html`，直接上传 |
| App 内片段 | `tools/privacy/out/app-privacy.html` | 否 | 供 WB-2 注入参考 |
| 兼容副本 | `tools/privacy/out/privacy.html` | 否 | 早期草稿文件名，与网页同文本 |
| 可见文本基准 | `tools/privacy/out/privacy-visible-text.txt` | 否 | diff 验收基准 |
| **App 数据** | `js/privacy-data.js` | **是** | PWA 与 APK 运行时读取，随源码提交 |

`tools/privacy/out/` 已写入根 `.gitignore`，**不入库**；`privacy-site.zip` 属发布产物，随时可重建。

## 文本源格式

每行一条：`类型|正文`。类型 `T` 主标题、`M` 元信息、`H` 章节标题、`P` 段落、`N` 待办提示。
正文不要出现半角 `|`（用全角 `｜`），不要用 `//` 开头。

**改隐私政策的正确流程**：只改 `privacy-source.txt` → 重跑 `build-privacy.mjs` → 重跑 3 个验收脚本 → 提交 `privacy-source.txt` 与 `js/privacy-data.js`。不要直接改 `out/` 或 `js/privacy-data.js`。

## 依赖

- Node.js 22+（使用全局 `WebSocket`、`fetch`）。
- Python（仅用标准库 `zipfile` 打/读 zip）：脚本按 `PYTHON` 环境变量 → `python` → `python3` → 本机常见路径依次探测，不写死某台机器。
- Headless Chromium（仅两个浏览器级验收脚本用）：按 `CHROME_PATH` 环境变量 → 常见 Windows / Linux 路径探测。找不到会明确报错，不会静默跳过。

## 版本号口径

`verify-privacy-ui.mjs` 从 `js/privacy-ui.js` 正则读取 `VERSION`，脚本内不硬编码日期。以后升级同意版本号，只需改应用源码，验收脚本自动跟随。

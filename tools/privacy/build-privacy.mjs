// 单一文本源 -> 静态站 / App 内片段 / 可见文本基准 / Cloudflare 上传 zip
// 用法：node tools/privacy/build-privacy.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const toolDir = dirname(fileURLToPath(import.meta.url));
const project = join(toolDir, '..', '..');
const outDir = join(toolDir, 'out');
mkdirSync(outDir, { recursive: true });

const lines = readFileSync(join(toolDir, 'privacy-source.txt'), 'utf8')
  .split(/\r?\n/)
  .filter((l) => l.trim() !== '' && !l.startsWith('//'));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const open = (t) => ({ T: '<h1>', M: '<p class="meta">', H: '<h2>', N: '<p class="todo">' }[t] || '<p>');
const close = (t) => (t === 'T' ? '</h1>' : t === 'H' ? '</h2>' : '</p>');

const body = lines.map((l) => {
  const i = l.indexOf('|');
  const t = l.slice(0, i);
  const text = l.slice(i + 1);
  return open(t) + esc(text) + close(t);
}).join('\n');

const style = `  :root { color-scheme: light; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0 auto; padding: 24px 20px 48px; max-width: 760px;
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
    font-size: 16px; line-height: 1.85; color: #2c2c2a; background: #ffffff;
  }
  h1 { font-size: 22px; font-weight: 500; margin: 0 0 4px; }
  h2 { font-size: 17px; font-weight: 500; margin: 28px 0 8px; }
  p { margin: 0 0 12px; }
  .meta { font-size: 14px; color: #5f5e5a; margin-bottom: 24px; }
  .todo { color: #a32d2d; }`;

const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>能吃吗 · 隐私政策</title>
<style>
${style}
</style>
</head>
<body>
${body}
</body>
</html>
`;

const appFragment = `<div class="privacy-content">
${body}
</div>
`;

const visibleText = lines.map((l) => l.slice(l.indexOf('|') + 1)).join('\n') + '\n';

writeFileSync(join(outDir, 'index.html'), indexHtml, 'utf8');
writeFileSync(join(outDir, 'app-privacy.html'), appFragment, 'utf8');
writeFileSync(join(outDir, 'privacy-visible-text.txt'), visibleText, 'utf8');
// 兼容副本：早期草稿文件名，保持与网页同一文本，避免历史引用读到旧版
writeFileSync(join(outDir, 'privacy.html'), indexHtml, 'utf8');

// Python 仅用于打 zip（标准库 zipfile）。不写死本机路径，方便其它机器复现。
function findPython() {
  const candidates = [process.env.PYTHON, 'python', 'python3', 'C:/Python314/python.exe'].filter(Boolean);
  for (const c of candidates) {
    try { execFileSync(c, ['-c', 'print(1)'], { stdio: 'ignore' }); return c; }
    catch {}
  }
  throw new Error('未找到 Python（用于生成 zip），可用 PYTHON 环境变量指定');
}
const zipPath = join(outDir, 'privacy-site.zip');
const py = `import zipfile, sys
out, src = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    z.write(src, 'index.html')
print('zip written:', out)`;
execFileSync(findPython(), ['-c', py, zipPath, join(outDir, 'index.html')], { stdio: 'inherit' });

// App 内文本数据（同一文本源），供首启弹窗与内置政策页渲染；PWA 与 APK 共用
const records = lines.map((l) => {
  const i = l.indexOf('|');
  return { t: l.slice(0, i), s: l.slice(i + 1) };
});
writeFileSync(join(project, 'js', 'privacy-data.js'), 'window.PRIVACY_CONTENT = ' + JSON.stringify(records, null, 2) + ';\n', 'utf8');

console.log('[build-privacy] 段落数:', lines.length);
console.log('[build-privacy] 产出: tools/privacy/out/{index.html, app-privacy.html, privacy.html, privacy-visible-text.txt, privacy-site.zip} + js/privacy-data.js');

// 把根目录的 PWA 源码复制成 Capacitor 用的离线资源目录 www/
// 只做「打包适配」，不修改任何源文件。
// SINGLE_MACHINE=1 时剥离所有 AI-BEGIN/AI-END 标记块，产出「商店单机版」资源。
import { mkdirSync, rmSync, readFileSync, writeFileSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
const SINGLE = process.env.SINGLE_MACHINE === '1';

function copyTree(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const from = join(src, name);
    const to = join(dest, name);
    if (statSync(from).isDirectory()) copyTree(from, to);
    else copyFileSync(from, to);
  }
}

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) files.push(...walk(p));
    else files.push(p);
  }
  return files;
}

// 标记块：含 AI-ELSE 时用「ELSE 之后的内容」替换，否则整块删除。
// 只在 www 副本上执行，PWA 源码中的 AI 功能完整保留。
function stripAI(src) {
  return src.replace(/\/\* AI-BEGIN \*\/([\s\S]*?)\/\* AI-END \*\//g, (_all, body) => {
    const k = body.indexOf('/* AI-ELSE */');
    if (k === -1) return '';
    const rest = body.slice(k + '/* AI-ELSE */'.length).replace(/^\r?\n/, '').replace(/\s+$/, '');
    return rest + '\n';
  });
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const item of ['index.html', 'icon.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'apple-touch-icon.png', 'manifest.webmanifest']) {
  copyFileSync(join(root, item), join(out, item));
}
copyTree(join(root, 'css'), join(out, 'css'));
copyTree(join(root, 'js'), join(out, 'js'));

// APP 内资源随包分发，Service Worker 反而会缓存住旧版本并触发无谓刷新，直接停用。
const appJsPath = join(out, 'js', 'app.js');
const appJs = readFileSync(appJsPath, 'utf8');
const marker = "if ('serviceWorker' in navigator)";
const patched = appJs.replace(marker, "if (false && 'serviceWorker' in navigator)");
if (patched === appJs) {
  throw new Error('未找到 Service Worker 注册语句，请检查 js/app.js');
}
writeFileSync(appJsPath, patched);

// 去掉静态资源的 ?v= 版本查询串：Capacitor 的本地 WebView 按路径映射资源，
// 带查询串在某些 WebView 版本上会匹配不到而白屏。APP 靠版本号整体更新，不需要它。
const htmlPath = join(out, 'index.html');
let html = readFileSync(htmlPath, 'utf8').replace(/\?v=[\d.]+/g, '');

if (SINGLE) {
  rmSync(join(out, 'js', 'ai.js'), { force: true });
  for (const f of ['app.js', 'store.js']) {
    const p = join(out, 'js', f);
    writeFileSync(p, stripAI(readFileSync(p, 'utf8')));
  }
  const cssPath = join(out, 'css', 'styles.css');
  writeFileSync(cssPath, stripAI(readFileSync(cssPath, 'utf8')));
  html = html.replace(/\s*<script src="js\/ai\.js[^"]*"><\/script>/g, '');
}
writeFileSync(htmlPath, html);

if (SINGLE) {
  // 单机版静态自检：任何命中都视为失败，不给 CI 留下含糊空间。
  // http://www.w3.org/2000/svg 是 SVG 命名空间字符串，不是网络请求，单独排除。
  const banned = [
    [/api\.deepseek\.com/, 'api.deepseek'],
    [/js\/ai\.js/, 'js/ai.js'],
    [/AI\s*助手|AI助手/, 'AI 助手'],
    [/fetch\s*\(/, 'fetch('],
    [/https?:\/\/(?!www\.w3\.org\/2000\/svg)/, 'http(s) 字面量'],
  ];
  const hits = [];
  for (const f of walk(out)) {
    const text = readFileSync(f, 'utf8');
    for (const [re, label] of banned) {
      if (re.test(text)) hits.push(`${relative(out, f)}: ${label}`);
    }
  }
  if (hits.length) {
    console.error('[single-machine] 静态自检 FAIL:');
    hits.forEach((h) => console.error('  ' + h));
    process.exit(1);
  }
  console.log('[single-machine] 静态自检 PASS：无 api.deepseek / js/ai.js / AI 助手 / fetch( / http(s) 字面量');
  console.log('[single-machine] www/ 已生成：单机版资源，AI 入口与 ai.js 已剥离，PWA 源码未改动');
} else {
  console.log('[build:app] www/ 已生成：PWA 全功能（含 AI），不含 sw.js，已停用 SW 注册与 ?v= 查询串');
}

// 把根目录的 PWA 源码复制成 Capacitor 用的离线资源目录 www/
// 只做「打包适配」，不修改任何源文件。
import { mkdirSync, rmSync, readFileSync, writeFileSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');

function copyTree(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const from = join(src, name);
    const to = join(dest, name);
    if (statSync(from).isDirectory()) copyTree(from, to);
    else copyFileSync(from, to);
  }
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const item of ['index.html', 'icon.png', 'manifest.webmanifest']) {
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
const html = readFileSync(htmlPath, 'utf8');
writeFileSync(htmlPath, html.replace(/\?v=[\d.]+/g, ''));

console.log('[build:app] www/ 已生成：离线资源，不含 sw.js，已停用 SW 注册与 ?v= 查询串');

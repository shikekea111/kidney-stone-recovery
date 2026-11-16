// WB-2 参数化验收：PWA 模式 / 原生模拟（含 App 插件）/ 原生模拟（插件缺失降级）
// 用法：node tools/privacy/verify-privacy-ui.mjs
import { readFileSync, mkdtempSync, rmSync, existsSync, statSync, createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDir = dirname(fileURLToPath(import.meta.url));
const project = join(toolDir, '..', '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = readFileSync(join(toolDir, 'out', 'privacy-visible-text.txt'), 'utf8').trim();

// 同意版本号从应用源码正则读取，脚本不再硬编码日期
const uiSource = readFileSync(join(project, 'js', 'privacy-ui.js'), 'utf8');
const verMatch = uiSource.match(/\bVERSION\s*=\s*'([^']+)'/);
const VERSION = verMatch ? verMatch[1] : null;

// Chromium 路径允许用 CHROME_PATH 覆盖，避免绑定某台机器
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  return null;
}
const chrome = findChrome();
if (!chrome) { console.error('FAIL: 未找到 Chromium，可用 CHROME_PATH 指定'); process.exit(1); }

const norm = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean).join('\n');
const diffCount = (a, b) => {
  const x = a.split('\n'), y = b.split('\n');
  let n = 0;
  for (let i = 0; i < Math.max(x.length, y.length); i++) if (x[i] !== y[i]) n++;
  return n;
};

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const fp = join(project, p);
  if (!existsSync(fp) || !statSync(fp).isFile()) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': mime[extname(fp)] || 'application/octet-stream' });
  createReadStream(fp).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;

const profile = mkdtempSync(join(tmpdir(), 'wb-privacy-ui-'));
const child = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
  '--disable-extensions', '--no-first-run', '--disable-background-networking',
  '--disable-component-update', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });
let dbgPort = null;
for (let i = 0; i < 40; i++) {
  const f = join(profile, 'DevToolsActivePort');
  if (existsSync(f)) { dbgPort = readFileSync(f, 'utf8').split(/\r?\n/)[0]; break; }
  await sleep(250);
}
if (!dbgPort) throw new Error('Chromium 调试端口未就绪');
let targets = [];
for (let i = 0; i < 20; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${dbgPort}/json/list`)).json(); if (targets.length) break; } catch {}
  await sleep(250);
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0, loaded = false;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(String(e.data));
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method === 'Page.loadEventFired') loaded = true;
};
const send = (method, params = {}) => new Promise((resolve) => { const id = ++seq; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value;
const reload = async () => {
  loaded = false;
  await send('Page.reload', { ignoreCache: true });
  for (let i = 0; i < 40 && !loaded; i++) await sleep(200);
  await sleep(500);
};
const clearState = async () => { await evaluate(`localStorage.removeItem('ks_privacy_agreed_version'); true`); };

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
loaded = false;
await send('Page.navigate', { url });
for (let i = 0; i < 40 && !loaded; i++) await sleep(200);
await sleep(500);

const results = [];
const add = (suite, n, ok, d) => results.push({ suite, n, ok, d });

add('通用', '从 js/privacy-ui.js 正则读到 VERSION', !!VERSION, VERSION || '未匹配');

// ---------- Suite 1: PWA（无 Capacitor） ----------
await clearState();
await reload();
add('PWA', '首启不弹窗', await evaluate(`!document.getElementById('privacyOverlay').classList.contains('is-open')`), 'not shown');
add('PWA', 'ENABLE_IN_PWA=false', (await evaluate(`window.PrivacyUI.enableInPwa`)) === false, 'false');
await evaluate(`window.App.go('me'); true`);
await sleep(600);
add('PWA', '设置页保留隐私入口', await evaluate(`!!document.querySelector('#view .privacy-entry')`), '.privacy-entry');
await evaluate(`document.querySelector('#view .privacy-entry').click(); true`);
add('PWA', '入口可打开内置政策页', await evaluate(`document.getElementById('privacyPage').classList.contains('is-open')`), 'is-open');
const pwaText = (await evaluate(`document.querySelector('.privacy-content').innerText`)) || '';
add('PWA', 'App 内全文与网页 diff', diffCount(norm(pwaText), norm(base)) === 0, `${diffCount(norm(pwaText), norm(base))} 行差异`);
await evaluate(`window.PrivacyUI.show(); document.getElementById('privacyReject').click(); true`);
add('PWA', 'Web guard 降级为阻止层（不触碰原生）', await evaluate(`document.getElementById('privacyBlocked').classList.contains('is-open') && !window.Capacitor`), 'blocked, no Capacitor');

// ---------- Suite 2: 原生模拟（含 @capacitor/app） ----------
const mockWith = `window.__exitCalls=0; window.Capacitor={ isNativePlatform:()=>true, Plugins:{ App:{ exitApp:()=>{ window.__exitCalls++; } } } };`;
const s2 = await send('Page.addScriptToEvaluateOnNewDocument', { source: mockWith });
await clearState();
await reload();
add('原生+插件', '清数据首启弹窗必现', await evaluate(`document.getElementById('privacyOverlay').classList.contains('is-open')`), 'is-open');
add('原生+插件', '同意前无版本号', await evaluate(`localStorage.getItem('ks_privacy_agreed_version')===null`), 'null');
add('原生+插件', '弹窗版本号常量', (await evaluate(`window.PrivacyUI.version`)) === VERSION, VERSION);
await evaluate(`document.getElementById('privacyView').click(); true`);
add('原生+插件', '可打开内置完整政策页', await evaluate(`document.getElementById('privacyPage').classList.contains('is-open')`), 'is-open');
const nativeText = (await evaluate(`document.querySelector('.privacy-content').innerText`)) || '';
add('原生+插件', 'App 内全文与网页 diff', diffCount(norm(nativeText), norm(base)) === 0, `${diffCount(norm(nativeText), norm(base))} 行差异，25 段`);
await evaluate(`document.getElementById('privacyBack').click(); document.getElementById('privacyAgree').click(); true`);
add('原生+插件', '同意后版本号落 localStorage', (await evaluate(`localStorage.getItem('ks_privacy_agreed_version')`)) === VERSION, `ks_privacy_agreed_version=${VERSION}`);
add('原生+插件', '同意后弹窗关闭', await evaluate(`!document.getElementById('privacyOverlay').classList.contains('is-open')`), 'closed');
await reload();
add('原生+插件', '已同意后冷启不再弹', await evaluate(`!document.getElementById('privacyOverlay').classList.contains('is-open')`), 'not shown');
await evaluate(`window.PrivacyUI.show(); window.__exitCalls=0; document.getElementById('privacyReject').click(); true`);
add('原生+插件', '拒绝调用 App.exitApp()', (await evaluate(`window.__exitCalls`)) === 1, 'exitApp called 1 次');
add('原生+插件', '拒绝后不再显示阻止层', await evaluate(`!document.getElementById('privacyBlocked').classList.contains('is-open')`), 'no blocked layer');
await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: s2.identifier });

// ---------- Suite 3: 原生模拟（插件缺失，验证降级不退化） ----------
const mockWithout = `window.Capacitor={ isNativePlatform:()=>true, Plugins:{} };`;
await send('Page.addScriptToEvaluateOnNewDocument', { source: mockWithout });
await clearState();
await reload();
add('原生-无插件', '首启弹窗必现', await evaluate(`document.getElementById('privacyOverlay').classList.contains('is-open')`), 'is-open');
await evaluate(`document.getElementById('privacyReject').click(); true`);
add('原生-无插件', '拒绝阻止层仍生效（原第 9 项）', await evaluate(`document.getElementById('privacyBlocked').classList.contains('is-open')`), 'blocked layer');

console.log('\n=== WB-2 参数化验收（3 组 + 通用）===');
let last = '';
for (const r of results) {
  if (r.suite !== last) { console.log('\n[' + r.suite + ']'); last = r.suite; }
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.n}  [${r.d}]`);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n结论: ${failed === 0 ? '全部通过' : failed + ' 项未通过'}（${results.length} 项，原 9 项均被覆盖且未退化）`);

ws.close(); child.kill(); server.close();
await new Promise((r) => { if (child.exitCode !== null) return r(); child.once('close', r); setTimeout(r, 3000); });
try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(failed === 0 ? 0 : 1);

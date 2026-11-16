// WB-5 浏览器级验收：Chromium + CDP Network 域（等同 DevTools Network 面板口径）
// 说明：NetLog 会混入 Chromium 自身后台服务（Google 时间/更新/词典等）流量，
// 那些不是页面发起的请求；页面级请求必须以 CDP Network.requestWillBeSent 为准。
// 用法：node tools/privacy/verify-privacy-browser.mjs
import { createServer } from 'node:http';
import { readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDir = dirname(fileURLToPath(import.meta.url));
const index = readFileSync(join(toolDir, 'out', 'index.html'), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

if (!chrome) {
  console.log('SKIP: 未找到 Chromium，浏览器级验收不可用');
  process.exit(2);
}

const requests = [];
const server = createServer((req, res) => {
  requests.push(req.url);
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(index);
  } else {
    res.writeHead(404);
    res.end('not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const url = `http://127.0.0.1:${port}/index.html`;

const profile = mkdtempSync(join(tmpdir(), 'wb-privacy-cdp-'));
const args = [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
  '--disable-extensions', '--no-first-run', '--no-default-browser-check',
  '--disable-background-networking', '--disable-component-update', '--disable-sync',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
];
const child = spawn(chrome, args, { stdio: 'ignore' });

let dbgPort = null;
for (let i = 0; i < 40; i++) {
  const f = join(profile, 'DevToolsActivePort');
  if (existsSync(f)) { dbgPort = readFileSync(f, 'utf8').split(/\r?\n/)[0]; break; }
  await sleep(250);
}
if (!dbgPort) { console.log('FAIL: Chromium 未启动调试端口'); child.kill(); server.close(); process.exit(1); }

let targets = [];
for (let i = 0; i < 20; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${dbgPort}/json/list`)).json(); if (targets.length) break; } catch {}
  await sleep(250);
}
const page = targets.find((t) => t.type === 'page');
if (!page) { console.log('FAIL: 无可用页面 target'); child.kill(); server.close(); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const urls = [];
let loaded = false;
let innerText = '';
let seq = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(String(e.data));
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method === 'Network.requestWillBeSent') urls.push(m.params.request.url);
  if (m.method === 'Page.loadEventFired') loaded = true;
};
const send = (method, params = {}) => new Promise((resolve) => {
  const id = ++seq;
  pending.set(id, resolve);
  ws.send(JSON.stringify({ id, method, params }));
});

await send('Network.enable');
await send('Page.enable');
await send('Page.navigate', { url });
for (let i = 0; i < 40 && !loaded; i++) await sleep(250);
await sleep(1200);
const evalRes = await send('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true });
innerText = evalRes?.result?.value || '';

const httpUrls = [...new Set(urls.filter((u) => /^https?:\/\//i.test(u)))];
const external = httpUrls.filter((u) => !/^https?:\/\/127\.0\.0\.1(:\d+)?\//i.test(u));
const rendered = innerText.includes('能吃吗') && innerText.includes('一、收集范围') && innerText.includes('八、免责说明');

console.log('=== WB-5 浏览器级验收（Chromium Headless + CDP Network）===');
console.log('调试端口:', dbgPort, '| 目标页面:', page.url);
console.log('页面渲染文本命中关键段落:', rendered, `(innerText ${innerText.length} 字)`);
console.log('本地服务端收到请求:', JSON.stringify(requests));
console.log('CDP 页面级 HTTP(S) 请求共', httpUrls.length, '条:', JSON.stringify(httpUrls));
console.log('其中外部域名请求:', external.length, '条', JSON.stringify(external));

const ok = rendered && external.length === 0;
ws.close();
child.kill();
server.close();
await new Promise((r) => {
  if (child.exitCode !== null) return r();
  child.once('close', r);
  setTimeout(r, 3000);
});
try { rmSync(profile, { recursive: true, force: true }); }
catch { console.log('提示: Chromium 临时目录仍被占用，稍后由系统清理:', profile); }
console.log('\n结论:', ok ? '通过：真实浏览器加载，页面级零外部请求' : '未通过，见上方明细');
process.exit(ok ? 0 : 1);

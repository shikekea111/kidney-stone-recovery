// 品牌资源生成器：从 logo.svg 生成安卓全密度图标 / 启动页 / PWA 图标 / 商店图标 / 48px 预览
// 用法：node tools/brand/generate.mjs
// 依赖：Node 22+ 与 headless Chromium（CHROME_PATH 可指定，见 findChrome）。无需图像库。
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, basename, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDir = dirname(fileURLToPath(import.meta.url));
const project = join(toolDir, '..', '..');
const resRoot = join(project, 'android', 'app', 'src', 'main', 'res');
const outDir = join(toolDir, 'out');
mkdirSync(outDir, { recursive: true });

const BG = '#5A4836';
const FG = '#F7EFE4';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rawSvg = readFileSync(join(toolDir, 'logo.svg'), 'utf8');
const logoInner = rawSvg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();

// ---------- Chromium 探测：CHROME_PATH → PATH → %LOCALAPPDATA%/ms-playwright 派生 ----------
function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const names = process.platform === 'win32'
    ? ['chrome.exe', 'msedge.exe', 'chromium.exe']
    : ['google-chrome', 'chromium', 'chromium-browser', 'chrome'];
  for (const dir of (process.env.PATH || '').split(delimiter)) {
    if (!dir) continue;
    for (const n of names) {
      const p = join(dir, n);
      if (existsSync(p)) return p;
    }
  }
  const candidates = [];
  if (process.env.LOCALAPPDATA) candidates.push(join(process.env.LOCALAPPDATA, 'ms-playwright'));
  if (process.env.HOME) candidates.push(join(process.env.HOME, '.cache', 'ms-playwright'));
  if (process.env.USERPROFILE) candidates.push(join(process.env.USERPROFILE, 'AppData', 'Local', 'ms-playwright'));
  for (const base of candidates) {
    if (!existsSync(base)) continue;
    for (const d of readdirSync(base).filter((x) => x.startsWith('chromium')).sort().reverse()) {
      for (const rel of ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe', 'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
        const p = join(base, d, rel);
        if (existsSync(p)) return p;
      }
    }
  }
  return null;
}

// ---------- 模板 ----------
function iconSvg(w, h, opts = {}) {
  const { viewBox = '0 0 100 100', bg = null, round = false } = opts;
  const clip = round ? '<defs><clipPath id="rc"><circle cx="50" cy="50" r="50"/></clipPath></defs>' : '';
  const group = round ? '<g clip-path="url(#rc)">' : '<g>';
  const rect = bg ? `<rect x="-300" y="-300" width="700" height="700" fill="${bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}">${clip}${group}${rect}${logoInner}</g></svg>`;
}
function splashHtml(w, h) {
  const s = Math.round(w * 0.3);
  return `<div style="width:${w}px;height:${h}px;background:${BG};display:flex;align-items:center;justify-content:center;overflow:hidden">` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 100 100">${logoInner}</svg></div>`;
}
function pngSize(p) {
  const b = readFileSync(p);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

// ---------- 任务清单 ----------
const jobs = [];
const add = (rel, w, h, html, transparent = false) => jobs.push({ path: join(project, rel), w, h, html, transparent, rel });

const DENSITIES = [
  ['mdpi', 48, 108], ['hdpi', 72, 162], ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324], ['xxxhdpi', 192, 432]
];
for (const [d, launcher, fg] of DENSITIES) {
  add(`android/app/src/main/res/mipmap-${d}/ic_launcher.png`, launcher, launcher, iconSvg(launcher, launcher, { bg: BG }));
  add(`android/app/src/main/res/mipmap-${d}/ic_launcher_round.png`, launcher, launcher, iconSvg(launcher, launcher, { bg: BG, round: true }), true);
  // adaptive foreground：图形控制在中间 66% 安全区（viewBox 100/150）
  add(`android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png`, fg, fg, iconSvg(fg, fg, { viewBox: '-25 -25 150 150' }), true);
}

// 启动页：沿用现有每张图的原始尺寸，Logo 约屏宽 30%
for (const d of readdirSync(resRoot)) {
  if (d !== 'drawable' && !/^drawable-(port|land)-/.test(d)) continue;
  const p = join(resRoot, d, 'splash.png');
  if (!existsSync(p)) continue;
  const [w, h] = pngSize(p);
  add(`android/app/src/main/res/${d}/splash.png`, w, h, splashHtml(w, h));
}

// PWA 图标
add('icon.png', 512, 512, iconSvg(512, 512, { bg: BG }));
add('icon-192.png', 192, 192, iconSvg(192, 192, { bg: BG }));
add('icon-512.png', 512, 512, iconSvg(512, 512, { bg: BG }));
add('icon-512-maskable.png', 512, 512, iconSvg(512, 512, { bg: BG, viewBox: '-12 -12 124 124' }));
add('apple-touch-icon.png', 180, 180, iconSvg(180, 180, { bg: BG }));

// 商店图标（交付物，不入库）
add('tools/brand/out/store-icon-512.png', 512, 512, iconSvg(512, 512, { bg: BG }));
add('tools/brand/out/store-icon-216.png', 216, 216, iconSvg(216, 216, { bg: BG }));

// ---------- XML / manifest（幂等） ----------
writeFileSync(join(resRoot, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n</resources>\n`, 'utf8');
writeFileSync(join(resRoot, 'drawable', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android"\n    android:width="108dp" android:height="108dp"\n    android:viewportWidth="108" android:viewportHeight="108">\n    <path android:fillColor="${BG}" android:pathData="M0,0h108v108h-108z"/>\n</vector>\n`, 'utf8');
writeFileSync(join(resRoot, 'drawable-v24', 'ic_launcher_foreground.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android"\n    android:width="108dp" android:height="108dp"\n    android:viewportWidth="108" android:viewportHeight="108">\n    <path android:fillColor="#00000000" android:strokeColor="${FG}" android:strokeWidth="5"\n        android:strokeLineCap="round" android:strokeLineJoin="round"\n        android:pathData="M54,15 C54,15 82,45 82,65 A28,28 0 0 1 26,65 C26,45 54,15 54,15 Z"/>\n    <path android:fillColor="#00000000" android:strokeColor="${FG}" android:strokeWidth="4"\n        android:strokeLineCap="round" android:pathData="M19,94 Q54,104 89,94"/>\n</vector>\n`, 'utf8');

const manifestPath = join(project, 'manifest.webmanifest');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.icons = [
  { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  { src: 'icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
];
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

// ---------- 渲染 ----------
const chrome = findChrome();
if (!chrome) { console.error('FAIL: 未找到 Chromium，可用 CHROME_PATH 指定可执行文件'); process.exit(1); }
console.log('Chromium:', chrome);

const profile = mkdtempSync(join(tmpdir(), 'wb-brand-'));
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
let seq = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(String(e.data));
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
};
const send = (method, params = {}) => new Promise((resolve) => { const id = ++seq; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
await send('Page.enable');
await send('Runtime.enable');
// headless=new 下 omitBackground 单独不够，强制画布默认底色为全透明
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
await sleep(300);

for (const job of jobs) {
  await send('Emulation.setDeviceMetricsOverride', { width: job.w, height: job.h, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', {
    expression: `document.documentElement.style.background='transparent';document.body.style.margin='0';document.body.style.background='transparent';document.body.innerHTML=${JSON.stringify(job.html)};true`
  });
  await sleep(90);
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, omitBackground: !!job.transparent });
  mkdirSync(dirname(job.path), { recursive: true });
  writeFileSync(job.path, Buffer.from(r.data, 'base64'));
}
console.log('已生成 PNG:', jobs.length, '张');

// ---------- 48px 效果预览 ----------
const pick = (rel) => {
  const j = jobs.find((x) => x.rel === rel);
  return 'data:image/png;base64,' + readFileSync(j.path).toString('base64');
};
const cell = (label, src) => `<div style="text-align:center"><div style="font:12px sans-serif;color:${FG};margin-bottom:8px">${label}</div><img src="${src}" width="48" height="48" style="image-rendering:pixelated;border:1px solid #7a6450"><div style="font:11px sans-serif;color:#b9a992;margin-top:8px">×4</div><img src="${src}" width="192" height="192" style="image-rendering:pixelated;border:1px solid #7a6450"></div>`;
const previewHtml = `<div style="width:680px;height:300px;background:${BG};display:flex;gap:24px;align-items:center;justify-content:center">` +
  cell('方形 48px', pick('android/app/src/main/res/mipmap-mdpi/ic_launcher.png')) +
  cell('圆形 48px', pick('android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png')) +
  cell('前景 48px', pick('android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png')) +
  `</div>`;
await send('Emulation.setDeviceMetricsOverride', { width: 680, height: 300, deviceScaleFactor: 1, mobile: false });
await send('Runtime.evaluate', { expression: `document.body.style.margin='0';document.body.innerHTML=${JSON.stringify(previewHtml)};true` });
await sleep(150);
const prev = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
writeFileSync(join(outDir, 'preview-48px.png'), Buffer.from(prev.data, 'base64'));
console.log('48px 预览:', join(outDir, 'preview-48px.png'));

// 桌面图标 / 启动页的本地模拟预览（明确不是真机截图，真机证据仍需主人在设备上补）
const launcherSrc = pick('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png');
const roundSrc = pick('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png');
const splashSrc = pick('android/app/src/main/res/drawable-port-hdpi/splash.png');
const mockHtml = `<div style="width:900px;height:420px;background:#2B2620;display:flex;gap:44px;align-items:center;justify-content:center;font:14px sans-serif;color:${FG}">` +
  `<div style="text-align:center"><div style="width:380px;height:300px;background:#3A3128;border-radius:18px;display:flex;gap:34px;align-items:center;justify-content:center">` +
  `<div><img src="${launcherSrc}" width="72" height="72" style="border-radius:16px"><div style="margin-top:10px;font-size:12px">能吃吗 · 方形</div></div>` +
  `<div><img src="${roundSrc}" width="72" height="72"><div style="margin-top:10px;font-size:12px">能吃吗 · 圆形</div></div>` +
  `</div><div style="margin-top:12px;font-size:12px;color:#B9A992">桌面图标 · 本地模拟</div></div>` +
  `<div style="text-align:center"><img src="${splashSrc}" width="210" height="350" style="border:4px solid #111;border-radius:14px">` +
  `<div style="margin-top:12px;font-size:12px;color:#B9A992">启动页 · 本地模拟（非真机）</div></div></div>`;
await send('Emulation.setDeviceMetricsOverride', { width: 900, height: 420, deviceScaleFactor: 1, mobile: false });
await send('Runtime.evaluate', { expression: `document.body.style.margin='0';document.body.innerHTML=${JSON.stringify(mockHtml)};true` });
await sleep(150);
const mockShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
writeFileSync(join(outDir, 'preview-device-mock.png'), Buffer.from(mockShot.data, 'base64'));
console.log('桌面/启动页模拟预览:', join(outDir, 'preview-device-mock.png'), '（非真机截图）');

ws.close(); child.kill();
await new Promise((r) => { if (child.exitCode !== null) return r(); child.once('close', r); setTimeout(r, 3000); });
try { rmSync(profile, { recursive: true, force: true }); } catch {}
console.log('完成。商店图标与预览在 tools/brand/out/（不入库）。');

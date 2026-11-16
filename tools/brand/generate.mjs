// 品牌资源生成器：视觉唯一源 = design-demos/final/（主人 2026-11-16 21:45 选定的 dir-2 终版）
// 用法：node tools/brand/generate.mjs
// 依赖：Node 22+ 与 headless Chromium（CHROME_PATH 可指定，见 findChrome）。不引入图像库。
// 说明：终版只有 PNG，没有可复用的 SVG 路径数据，因此沿用 Chromium CDP 渲染管线，
//      把终版 PNG 以 data URI 嵌入后按目标尺寸缩放输出。logo.svg（A 方案）不再参与生成。
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDir = dirname(fileURLToPath(import.meta.url));
const project = join(toolDir, '..', '..');
const resRoot = join(project, 'android', 'app', 'src', 'main', 'res');
const finalDir = join(project, 'design-demos', 'final');
const outDir = join(toolDir, 'out');
mkdirSync(outDir, { recursive: true });

const BG = '#5A4836';
const FG = '#F7EFE4';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- 终版视觉源 ----------
const REQUIRED = ['icon-1024.png', 'icon-512-maskable.png', 'ic_launcher_foreground.png'];
for (const n of REQUIRED) {
  if (!existsSync(join(finalDir, n))) {
    console.error(`FAIL: 缺少视觉唯一源 design-demos/final/${n}`);
    process.exit(1);
  }
}
const dataUri = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64');
const SRC = {
  icon: dataUri(join(finalDir, 'icon-1024.png')),
  maskable: dataUri(join(finalDir, 'icon-512-maskable.png')),
  foreground: dataUri(join(finalDir, 'ic_launcher_foreground.png'))
};
// 启动页新旧对比：必须在覆盖前读取旧图
const splashOldPath = join(resRoot, 'drawable-port-hdpi', 'splash.png');
const OLD_SPLASH = existsSync(splashOldPath) ? dataUri(splashOldPath) : null;

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

// ---------- 模板（全部来自终版 PNG） ----------
function iconHtml(w, h, opts = {}) {
  const { src = SRC.icon, round = false } = opts;
  const radius = round ? '50%' : '0';
  return `<div style="width:${w}px;height:${h}px;border-radius:${radius};overflow:hidden;background:${BG}">` +
    `<img src="${src}" width="${w}" height="${h}" style="display:block;width:${w}px;height:${h}px"></div>`;
}
// adaptive foreground：终版前景自带透明安全区（实测不透明 bbox 占比约 15%，远低于 61% 上限），直接等比铺满画布
function foregroundHtml(w, h) {
  return `<div style="width:${w}px;height:${h}px;background:transparent;display:flex;align-items:center;justify-content:center">` +
    `<img src="${SRC.foreground}" width="${w}" height="${h}" style="display:block;width:${w}px;height:${h}px"></div>`;
}
function splashHtml(w, h) {
  const s = Math.round(w * 0.3);
  return `<div style="width:${w}px;height:${h}px;background:${BG};display:flex;align-items:center;justify-content:center;overflow:hidden">` +
    `<img src="${SRC.icon}" width="${s}" height="${s}" style="display:block;width:${s}px;height:${s}px"></div>`;
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
  add(`android/app/src/main/res/mipmap-${d}/ic_launcher.png`, launcher, launcher, iconHtml(launcher, launcher));
  add(`android/app/src/main/res/mipmap-${d}/ic_launcher_round.png`, launcher, launcher, iconHtml(launcher, launcher, { round: true }), true);
  add(`android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png`, fg, fg, foregroundHtml(fg, fg), true);
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
add('icon.png', 512, 512, iconHtml(512, 512));
add('icon-192.png', 192, 192, iconHtml(192, 192));
add('icon-512.png', 512, 512, iconHtml(512, 512));
add('icon-512-maskable.png', 512, 512, iconHtml(512, 512, { src: SRC.maskable }));
add('apple-touch-icon.png', 180, 180, iconHtml(180, 180));

// 商店图标（交付物，不入库）
add('tools/brand/out/store-icon-512.png', 512, 512, iconHtml(512, 512));
add('tools/brand/out/store-icon-216.png', 216, 216, iconHtml(216, 216));

// ---------- XML / manifest（幂等） ----------
writeFileSync(join(resRoot, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n</resources>\n`, 'utf8');
writeFileSync(join(resRoot, 'drawable', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android"\n    android:width="108dp" android:height="108dp"\n    android:viewportWidth="108" android:viewportHeight="108">\n    <path android:fillColor="${BG}" android:pathData="M0,0h108v108h-108z"/>\n</vector>\n`, 'utf8');
// 该 vector 是 Capacitor 遗留资源，anydpi-v26 实际引用 @mipmap/ic_launcher_foreground（终版 PNG）。
// 清掉旧 A 方案的线描水滴 + 弧线，改为透明占位，避免任何路径再渲染出旧视觉。
writeFileSync(join(resRoot, 'drawable-v24', 'ic_launcher_foreground.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<!-- adaptive foreground 实际使用 @mipmap/ic_launcher_foreground（dir-2 终版 PNG）；本 vector 仅占位，避免旧 A 方案残留 -->\n<vector xmlns:android="http://schemas.android.com/apk/res/android"\n    android:width="108dp" android:height="108dp"\n    android:viewportWidth="108" android:viewportHeight="108">\n    <path android:fillColor="#00000000" android:pathData="M0,0h108v108h-108z"/>\n</vector>\n`, 'utf8');

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

// ---------- 自适应前景安全区实测（canvas 量不透明像素外接框） ----------
const areaExpr = `(async()=>{
  const img=new Image(); img.src=${JSON.stringify(SRC.foreground)}; await img.decode();
  const c=document.createElement('canvas'); c.width=img.width; c.height=img.height;
  const ctx=c.getContext('2d'); ctx.drawImage(img,0,0);
  const d=ctx.getImageData(0,0,c.width,c.height).data;
  let x0=c.width,y0=c.height,x1=-1,y1=-1;
  for(let y=0;y<c.height;y++) for(let x=0;x<c.width;x++){
    if(d[(y*c.width+x)*4+3]>0){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
  }
  return JSON.stringify({w:c.width,h:c.height,bbox:[x0,y0,x1+1,y1+1],
    bboxRatio:+(((x1-x0+1)*(y1-y0+1))/(c.width*c.height)).toFixed(6),
    widthRatio:+((x1-x0+1)/c.width).toFixed(6), heightRatio:+((y1-y0+1)/c.height).toFixed(6)});
})()`;
const areaRes = await send('Runtime.evaluate', { expression: areaExpr, awaitPromise: true, returnByValue: true });
const area = JSON.parse(areaRes.result.value);
area.limitRatio = 0.61;
area.pass = area.bboxRatio <= 0.61 && area.widthRatio <= 0.61 && area.heightRatio <= 0.61;
area.source = 'design-demos/final/ic_launcher_foreground.png';
writeFileSync(join(outDir, 'foreground-safe-area.json'), JSON.stringify(area, null, 2) + '\n');
console.log('前景安全区实测:', JSON.stringify(area));

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

// 60px / 120px 目视预览（终版自带的原始尺寸，直接用最终产物核对）
const p60 = 'data:image/png;base64,' + readFileSync(join(project, 'icon-192.png')).toString('base64');
const p120 = 'data:image/png;base64,' + readFileSync(join(finalDir, 'icon-120.png')).toString('base64');
const smallHtml = `<div style="width:680px;height:220px;background:${BG};display:flex;gap:40px;align-items:center;justify-content:center;font:13px sans-serif;color:${FG}">` +
  `<div style="text-align:center"><img src="${p60}" width="60" height="60"><div style="margin-top:10px">PWA 产物缩放至 60px</div></div>` +
  `<div style="text-align:center"><img src="${p120}" width="120" height="120"><div style="margin-top:10px">终版 120px（视觉源）</div></div>` +
  `<div style="text-align:center"><img src="${p60}" width="240" height="240" style="image-rendering:pixelated"><div style="margin-top:10px">60px ×4 放大</div></div></div>`;
await send('Emulation.setDeviceMetricsOverride', { width: 680, height: 220, deviceScaleFactor: 1, mobile: false });
await send('Runtime.evaluate', { expression: `document.body.style.margin='0';document.body.innerHTML=${JSON.stringify(smallHtml)};true` });
await sleep(150);
const small = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
writeFileSync(join(outDir, 'preview-60-120.png'), Buffer.from(small.data, 'base64'));
console.log('60/120px 预览:', join(outDir, 'preview-60-120.png'));

// 桌面图标 / 启动页本地模拟预览（非真机）
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

// 启动页新旧对比（旧图在覆盖前已读入内存）
if (OLD_SPLASH) {
  const cmpHtml = `<div style="width:820px;height:380px;background:#211D19;display:flex;gap:30px;align-items:center;justify-content:center;font:14px sans-serif;color:${FG}">` +
    `<div style="text-align:center"><img src="${OLD_SPLASH}" width="140" height="233" style="border:3px solid #8a7560"><div style="margin-top:10px;color:#c9b9a6">旧 · A 方案线描水滴+弧线</div></div>` +
    `<div style="text-align:center"><img src="${splashSrc}" width="140" height="233" style="border:3px solid #2e7d4f"><div style="margin-top:10px;color:#9fd5b4">新 · dir-2 米白水滴+绿勾</div></div></div>`;
  await send('Emulation.setDeviceMetricsOverride', { width: 820, height: 380, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', { expression: `document.body.style.margin='0';document.body.innerHTML=${JSON.stringify(cmpHtml)};true` });
  await sleep(150);
  const cmp = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(join(outDir, 'preview-splash-compare.png'), Buffer.from(cmp.data, 'base64'));
  console.log('启动页新旧对比:', join(outDir, 'preview-splash-compare.png'));
}

ws.close(); child.kill();
await new Promise((r) => { if (child.exitCode !== null) return r(); child.once('close', r); setTimeout(r, 3000); });
try { rmSync(profile, { recursive: true, force: true }); } catch {}
console.log('完成。商店图标、预览与安全区证据在 tools/brand/out/（不入库）。');

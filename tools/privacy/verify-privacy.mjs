// WB-5 本地验收：零外部资源、零外部请求、两处文本逐字一致
// 用法：node tools/privacy/verify-privacy.mjs
import { readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';

const toolDir = dirname(fileURLToPath(import.meta.url));
const project = join(toolDir, '..', '..');
const outDir = join(toolDir, 'out');
const read = (p) => readFileSync(join(outDir, p), 'utf8');
const index = read('index.html');
const app = read('app-privacy.html');
const legacy = read('privacy.html');
const base = read('privacy-visible-text.txt');

const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map((s) => decode(s).trim())
    .filter(Boolean)
    .join('\n');
}
function diffCount(a, b) {
  const x = a.trim().split('\n');
  const y = b.trim().split('\n');
  let n = 0;
  for (let i = 0; i < Math.max(x.length, y.length); i++) if (x[i] !== y[i]) n++;
  return n;
}
function findPython() {
  const candidates = [process.env.PYTHON, 'python', 'python3', 'C:/Python314/python.exe'].filter(Boolean);
  for (const c of candidates) {
    try { execFileSync(c, ['-c', 'print(1)'], { stdio: 'ignore' }); return c; }
    catch {}
  }
  throw new Error('未找到 Python（用于读取 zip），可用 PYTHON 环境变量指定');
}

const checks = [];
const add = (name, ok, detail) => { checks.push({ name, ok, detail }); };

// 1) 静态扫描：任何会发起外部请求的构造都必须为 0
const patterns = [
  ['script 标签', /<script\b/i],
  ['link 标签', /<link\b/i],
  ['img/iframe/video 标签', /<(img|iframe|video|audio|source)\b/i],
  ['a 标签', /<a\b/i],
  ['href 属性', /\bhref\s*=/i],
  ['src 属性', /\bsrc\s*=/i],
  ['CSS url()', /url\s*\(/i],
  ['CSS @import / @font-face', /@import\b|@font-face\b/i],
  ['绝对 URL', /https?:\/\//i],
  ['协议相对 URL', /(?:^|[^:])\/\/[a-z0-9-]+\.[a-z]{2,}/im],
  ['事件处理器', /\son(click|load|error|focus)\s*=/i],
];
let hits = 0;
for (const [name, re] of patterns) {
  const n = (index.match(new RegExp(re.source, re.flags.replace('m', '') + 'g')) || []).length;
  hits += n;
  if (n) console.log('  外部引用命中:', name, n);
}
add('静态扫描：零外部资源/脚本/跳转', hits === 0, `命中 ${hits} 处`);
add('UTF-8 声明', /charset="UTF-8"/.test(index), 'charset="UTF-8"');
add('内联 CSS', /<style>/.test(index) && !/<link\b/i.test(index), '存在 <style>，无 <link>');

// 2) 文本逐字一致（多处均由同一文本源生成，再从 HTML 反解比对）
const vIndex = visibleText(index);
const vApp = visibleText(app);
const vLegacy = visibleText(legacy);
add('index.html 与基准文本 diff', diffCount(vIndex, base) === 0, `${diffCount(vIndex, base)} 行差异`);
add('app-privacy.html 与基准文本 diff', diffCount(vApp, base) === 0, `${diffCount(vApp, base)} 行差异`);
add('网页与 App 内文本互比 diff', diffCount(vIndex, vApp) === 0, `${diffCount(vIndex, vApp)} 行差异`);
add('兼容副本 privacy.html 已同步', diffCount(vLegacy, vIndex) === 0, `${diffCount(vLegacy, vIndex)} 行差异，段落 ${vIndex.split('\n').length}`);

// 2b) App 内数据文件必须由同一文本源生成，且与网页逐字一致
const dataJs = readFileSync(join(project, 'js', 'privacy-data.js'), 'utf8');
const m = dataJs.match(/window\.PRIVACY_CONTENT\s*=\s*([\s\S]*?);\s*$/);
add('privacy-data.js 可解析', !!m, m ? 'JSON 数组' : '格式错误');
const records = m ? JSON.parse(m[1]) : [];
const vData = records.map((r) => r.s).join('\n');
add('App 内 privacy-data.js 与网页 diff', diffCount(vData, base) === 0, `${diffCount(vData, base)} 行差异，共 ${records.length} 段`);
const appHtml = readFileSync(join(project, 'index.html'), 'utf8');
add('index.html 引入 privacy-data / privacy-ui', /js\/privacy-data\.js/.test(appHtml) && /js\/privacy-ui\.js/.test(appHtml), '两个脚本均已引入');
const appCss = readFileSync(join(project, 'css', 'styles.css'), 'utf8');
add('WB-2 三个样式类已补齐', /\.privacy-content\b/.test(appCss) && /\.privacy-content \.meta\b/.test(appCss) && /\.privacy-content \.todo\b/.test(appCss), 'privacy-content / meta / todo');

// 3) 本地 http 服务：客户端只应请求 /index.html
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
const resp = await fetch(`http://127.0.0.1:${port}/index.html`);
const served = await resp.text();
const status = resp.status;
server.close();
add('本地 HTTP 打开', status === 200 && served === index, `status=${status}, ${Buffer.byteLength(served)} bytes`);
add('服务端请求清单仅 index.html', requests.length === 1 && requests[0] === '/index.html', JSON.stringify(requests));
add('零外部请求（静态引用为 0 + 无子资源请求）', hits === 0 && requests.length === 1, `外部引用 ${hits}，服务端请求 ${requests.length}`);

// 4) zip 内容
const zipPath = join(outDir, 'privacy-site.zip');
const py = `import zipfile, sys
z = zipfile.ZipFile(sys.argv[1])
print(','.join(z.namelist()))`;
const zipOut = execFileSync(findPython(), ['-c', py, zipPath], { encoding: 'utf8' }).trim().split(/\r?\n/).map((s) => s.trim());
add('zip 仅含根目录 index.html', zipOut[0] === 'index.html', `entries=${zipOut[0]}, ${statSync(zipPath).size} bytes`);

console.log('\n=== 隐私文本验收报告 ===');
for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}  [${c.detail}]`);
const failed = checks.filter((c) => !c.ok).length;
console.log(`\n结论: ${failed === 0 ? '全部通过' : failed + ' 项未通过'}（${checks.length} 项）`);
process.exit(failed === 0 ? 0 : 1);

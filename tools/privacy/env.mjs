// 工具运行环境探测：不绑定任何一台机器的绝对路径。
// Python：PYTHON → python → python3 → py -3（仅 Windows）；Chromium：CHROME_PATH → PATH → ms-playwright 派生目录。
import { existsSync, readdirSync } from 'node:fs';
import { spawnSync, execFileSync } from 'node:child_process';
import { join, delimiter } from 'node:path';

function pythonCommand() {
  const candidates = [];
  if (process.env.PYTHON) candidates.push([process.env.PYTHON, []]);
  candidates.push(['python', []]);
  candidates.push(['python3', []]);
  if (process.platform === 'win32') candidates.push(['py', ['-3']]);
  for (const [cmd, prefix] of candidates) {
    try {
      const r = spawnSync(cmd, [...prefix, '-c', 'print(1)'], { stdio: 'ignore' });
      if (r.status === 0) return { cmd, prefix };
    } catch {}
  }
  return null;
}

export function runPython(code, args = [], opts = {}) {
  const found = pythonCommand();
  if (!found) {
    throw new Error('未找到 Python：已依次尝试 PYTHON 环境变量 / python / python3 / py -3。请安装 Python 或设置 PYTHON。');
  }
  return execFileSync(found.cmd, [...found.prefix, '-c', code, ...args], opts);
}

export function findChrome() {
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

  const roots = [];
  if (process.env.LOCALAPPDATA) roots.push(join(process.env.LOCALAPPDATA, 'ms-playwright'));
  if (process.env.USERPROFILE) roots.push(join(process.env.USERPROFILE, 'AppData', 'Local', 'ms-playwright'));
  if (process.env.HOME) roots.push(join(process.env.HOME, '.cache', 'ms-playwright'));
  for (const base of roots) {
    if (!existsSync(base)) continue;
    for (const d of readdirSync(base).filter((x) => x.startsWith('chromium')).sort().reverse()) {
      for (const rel of [
        'chrome-win64/chrome.exe', 'chrome-win/chrome.exe',
        'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'
      ]) {
        const p = join(base, d, rel);
        if (existsSync(p)) return p;
      }
    }
  }
  return null;
}

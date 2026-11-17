// privacy-ui.js — 首启隐私弹窗 + 内置隐私政策页（WB-2）
// 文本唯一来源：js/privacy-data.js，由 .workbuddy/dispatch/privacy-source.txt 生成。
// 改动隐私政策正文请改 privacy-source.txt 后重跑 build-privacy.mjs，不要直接改本文件。
(function (global) {
  'use strict';
  var VERSION = '2026-11-16';
  var KEY = 'ks_privacy_agreed_version';
  var ENABLE_IN_PWA = false; // PWA 不弹首启窗，只在原生 APK 内弹；PWA 保留「我的」页入口
  var DATA = global.PRIVACY_CONTENT || [];

  function isNative() {
    try { return !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform()); }
    catch (e) { return false; }
  }
  function enabled() { return ENABLE_IN_PWA || isNative(); }
  function agreed() { try { return global.localStorage.getItem(KEY) === VERSION; } catch (e) { return false; } }
  function agree() { try { global.localStorage.setItem(KEY, VERSION); } catch (e) {} }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function renderContent() {
    return DATA.map(function (r) {
      var s = esc(r.s);
      if (r.t === 'T') return '<h1>' + s + '</h1>';
      if (r.t === 'H') return '<h2>' + s + '</h2>';
      if (r.t === 'M') return '<p class="meta">' + s + '</p>';
      if (r.t === 'N') return '<p class="todo">' + s + '</p>';
      return '<p>' + s + '</p>';
    }).join('\n');
  }

  function mount() {
    var root = document.createElement('div');
    root.id = 'privacyRoot';
    root.innerHTML =
      '<div class="privacy-overlay" id="privacyOverlay">' +
        '<div class="privacy-dialog">' +
          '<h2>隐私政策</h2>' +
          '<p>使用「能吃吗」前，请先阅读并同意隐私政策。本应用为单机离线工具，所有数据仅保存在你的手机本机。</p>' +
          '<button type="button" class="privacy-link" id="privacyView">查看完整隐私政策</button>' +
          '<div class="privacy-actions">' +
            '<button type="button" class="privacy-btn ghost" id="privacyReject">拒绝</button>' +
            '<button type="button" class="privacy-btn primary" id="privacyAgree">同意并继续</button>' +
          '</div>' +
          '<p class="privacy-tip">不同意将无法使用本应用。</p>' +
        '</div>' +
      '</div>' +
      '<div class="privacy-overlay privacy-page" id="privacyPage">' +
        '<div class="privacy-sheet">' +
          '<button type="button" class="privacy-back" id="privacyBack">返回</button>' +
          '<div class="privacy-content">' + renderContent() + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="privacy-overlay" id="privacyBlocked">' +
        '<div class="privacy-dialog">' +
          '<h2>已拒绝隐私政策</h2>' +
          '<p>按合规要求，拒绝后无法继续使用本应用。请退出应用；如需使用，请重新打开并选择同意。</p>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
  }

  var LAYERS = ['privacyOverlay', 'privacyPage', 'privacyBlocked'];
  function show(id) {
    LAYERS.forEach(function (x) {
      var el = document.getElementById(x);
      if (el) el.classList.toggle('is-open', x === id);
    });
  }
  function hideAll() { show(''); }
  // 当前打开的隐私层 id（无则 ''）；供系统返回键判断，不改同意逻辑。
  function openLayer() {
    for (var i = 0; i < LAYERS.length; i++) {
      var el = document.getElementById(LAYERS[i]);
      if (el && el.classList.contains('is-open')) return LAYERS[i];
    }
    return '';
  }
  function isOpen() { return !!openLayer(); }
  // 只关闭「可关闭」的层：政策页返回首启弹窗；首启弹窗与拒绝阻止层属强制层，返回键不得绕过。
  function close() {
    if (openLayer() === 'privacyPage') { show('privacyOverlay'); return true; }
    return false;
  }

  // 拒绝：原生 APK 调用官方 @capacitor/app 的 App.exitApp() 真正退出；
  // Web guard —— 非原生环境绝不触碰原生插件，降级为「阻止继续使用」层。
  function exitApp() {
    if (isNative()) {
      try {
        var plugin = global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.App;
        if (plugin && typeof plugin.exitApp === 'function') {
          plugin.exitApp();
          return;
        }
      } catch (e) {}
    }
    show('privacyBlocked');
  }

  // PWA 不弹首启窗，但「我的」设置页保留一个可打开全文的入口。
  function injectEntry() {
    var view = document.getElementById('view');
    if (!view || view.querySelector('.privacy-entry')) return;
    if (!/数据备份/.test(view.textContent || '')) return;
    var card = document.createElement('div');
    card.className = 'card privacy-entry';
    card.setAttribute('role', 'button');
    card.innerHTML = '<div class="row-between"><h2>隐私政策</h2><span class="muted">›</span></div>' +
      '<div class="muted">查看完整隐私政策与数据说明</div>';
    card.addEventListener('click', function () { show('privacyPage'); });
    view.appendChild(card);
  }
  function watchSettings() {
    var view = document.getElementById('view');
    if (!view) return;
    try {
      new MutationObserver(function () { injectEntry(); }).observe(view, { childList: true, subtree: true });
    } catch (e) {}
    injectEntry();
  }

  function init() {
    if (!DATA.length) { console.warn('[privacy-ui] 未找到 PRIVACY_CONTENT，跳过'); return; }
    mount();
    document.getElementById('privacyView').addEventListener('click', function () { show('privacyPage'); });
    document.getElementById('privacyBack').addEventListener('click', function () { show('privacyOverlay'); });
    document.getElementById('privacyAgree').addEventListener('click', function () { agree(); hideAll(); });
    document.getElementById('privacyReject').addEventListener('click', exitApp);
    watchSettings();
    if (enabled() && !agreed()) show('privacyOverlay');
  }

  global.PrivacyUI = {
    show: function () { show('privacyOverlay'); },
    showPolicy: function () { show('privacyPage'); },
    reset: function () { try { global.localStorage.removeItem(KEY); } catch (e) {} },
    version: VERSION,
    isNative: isNative,
    enableInPwa: ENABLE_IN_PWA,
    isOpen: isOpen,
    close: close,
    // 首启弹窗/拒绝阻止层为强制同意层，返回键必须忽略（不可绕过）
    isMandatory: function () {
      var layer = openLayer();
      return layer === 'privacyOverlay' || layer === 'privacyBlocked';
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);

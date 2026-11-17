// back-button.js — 安卓系统返回键处理（仅原生环境注册，PWA 不碰）
// 依赖：PrivacyUI.isNative() / isOpen() / isMandatory() / close()，App.closeModal() / go()，
//       官方 @capacitor/app 的 App.exitApp()。全部缺失时安全降级，不抛错。
// 返回优先级：强制隐私层（忽略，不可绕过）→ 可关闭隐私层 → modal → 非建议页回建议 → 建议页退出。
(function (global) {
  'use strict';

  function plugin() {
    try {
      var c = global.Capacitor;
      return (c && c.Plugins && c.Plugins.App) || null;
    } catch (e) { return null; }
  }

  // 当前 tab：不依赖 App 暴露内部变量，直接读 DOM 上激活的 tab。
  function currentTab() {
    try {
      var active = document.querySelector('.tab.active');
      return active ? active.getAttribute('data-tab') : 'advice';
    } catch (e) { return 'advice'; }
  }

  function modalOpen() {
    try {
      var root = document.getElementById('modalRoot');
      return !!(root && root.innerHTML && root.innerHTML.trim());
    } catch (e) { return false; }
  }

  // 单测可直接调用；返回本次命中的分支名，便于断言。
  function handleBack() {
    var ui = global.PrivacyUI;

    // 1) 隐私强制层（首启弹窗 / 拒绝阻止层）：忽略，返回键不得绕过强制同意
    if (ui && typeof ui.isMandatory === 'function' && ui.isMandatory()) return 'privacy-mandatory-ignored';

    // 2) 可关闭的隐私层（政策页）：关闭，回到上一层
    if (ui && typeof ui.isOpen === 'function' && ui.isOpen()) {
      if (typeof ui.close === 'function' && ui.close()) return 'privacy-closed';
      return 'privacy-ignored';
    }

    // 3) 模态框打开：关闭模态框
    if (modalOpen()) {
      try {
        if (global.App && typeof global.App.closeModal === 'function') {
          global.App.closeModal();
          return 'modal-closed';
        }
      } catch (e) {}
      return 'modal-no-handler';
    }

    // 4) 非「建议」页：回到建议首页
    var tab = currentTab();
    if (tab !== 'advice') {
      try {
        if (global.App && typeof global.App.go === 'function') {
          global.App.go('advice');
          return 'back-to-advice';
        }
      } catch (e) {}
      return 'tab-no-handler';
    }

    // 5) 已在建议页：退出应用（与隐私拒绝一致；安卓系统惯例）
    var app = plugin();
    if (app && typeof app.exitApp === 'function') {
      try { app.exitApp(); return 'exit-app'; } catch (e) { return 'exit-failed'; }
    }
    return 'no-handler';
  }

  var registered = false;
  function register() {
    if (registered) return true; // 幂等：防止重复注册导致一次返回触发多次
    // PWA 绝不注册，避免影响浏览器原生后退行为
    var ui = global.PrivacyUI;
    var native = !!(ui && typeof ui.isNative === 'function' && ui.isNative());
    if (!native) return false;
    var app = plugin();
    if (!app || typeof app.addListener !== 'function') return false;
    try {
      app.addListener('backButton', function () { handleBack(); });
      registered = true;
    } catch (e) { return false; }
    return registered;
  }

  global.BackButton = {
    handleBack: handleBack,
    register: register,
    isRegistered: function () { return registered; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', register);
  else register();
})(window);

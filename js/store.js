// store.js - 本地数据层（localStorage + IndexedDB）
// 所有健康数据只存在用户本机，不上传任何服务器。
(function (global) {
  'use strict';
  const DB_NAME = 'kidney_stone_app';
  const DB_VERSION = 1;
  const STORE_IMAGES = 'report_images';

  const LS_PROFILE = 'ks_profile';
  const LS_TIMELINE = 'ks_timeline';
  const LS_REPORTS = 'ks_reports';
  const LS_AI = 'ks_ai';

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
  function todayStr() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function nowTime() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  // ---------- Profile ----------
  function getProfile() {
    try { return JSON.parse(localStorage.getItem(LS_PROFILE)) || null; }
    catch (e) { return null; }
  }
  function saveProfile(p) {
    localStorage.setItem(LS_PROFILE, JSON.stringify(p));
    return p;
  }

  // ---------- Timeline ----------
  function getTimeline() {
    try { return JSON.parse(localStorage.getItem(LS_TIMELINE)) || []; }
    catch (e) { return []; }
  }
  function addEvent(ev) {
    const list = getTimeline();
    ev.id = ev.id || uid();
    ev.createdAt = Date.now();
    list.push(ev);
    localStorage.setItem(LS_TIMELINE, JSON.stringify(list));
    return ev;
  }
  function updateEvent(id, patch) {
    const list = getTimeline();
    const i = list.findIndex(e => e.id === id);
    if (i >= 0) {
      list[i] = Object.assign({}, list[i], patch);
      localStorage.setItem(LS_TIMELINE, JSON.stringify(list));
      return list[i];
    }
    return null;
  }
  function deleteEvent(id) {
    const list = getTimeline().filter(e => e.id !== id);
    localStorage.setItem(LS_TIMELINE, JSON.stringify(list));
  }
  function getEventsByDate(dateStr) {
    return getTimeline().filter(e => e.date === dateStr);
  }

  // ---------- Reports ----------
  function getReports() {
    try { return JSON.parse(localStorage.getItem(LS_REPORTS)) || []; }
    catch (e) { return []; }
  }
  function addReport(r) {
    const list = getReports();
    r.id = r.id || uid();
    r.createdAt = Date.now();
    list.push(r);
    localStorage.setItem(LS_REPORTS, JSON.stringify(list));
    return r;
  }
  function deleteReport(id) {
    const list = getReports().filter(r => r.id !== id);
    localStorage.setItem(LS_REPORTS, JSON.stringify(list));
    deleteImage(id).catch(function () {});
  }

  // ---------- AI 配置（预留，默认未启用；备份不导出 Key） ----------
  function getAIConfig() {
    let c = null;
    try { c = JSON.parse(localStorage.getItem(LS_AI)); } catch (e) {}
    return Object.assign(
      { enabled: false, apiBase: 'https://api.deepseek.com/v1', apiKey: '', model: 'deepseek-chat' },
      c || {}
    );
  }
  function saveAIConfig(c) {
    const o = {
      enabled: !!(c && c.enabled),
      apiBase: ((c && c.apiBase) || 'https://api.deepseek.com/v1').replace(/\/+$/, ''),
      apiKey: (c && c.apiKey) || '',
      model: (c && c.model) || 'deepseek-chat'
    };
    localStorage.setItem(LS_AI, JSON.stringify(o));
    return o;
  }

  // ---------- IndexedDB (report images) ----------
  function openDB() {
    return new Promise(function (resolve, reject) {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          db.createObjectStore(STORE_IMAGES);
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  async function putImage(id, blob) {
    const db = await openDB();
    return new Promise(function (res, rej) {
      const tx = db.transaction(STORE_IMAGES, 'readwrite');
      tx.objectStore(STORE_IMAGES).put(blob, id);
      tx.oncomplete = function () { res(); };
      tx.onerror = function () { rej(tx.error); };
    });
  }
  async function getImage(id) {
    const db = await openDB();
    return new Promise(function (res, rej) {
      const tx = db.transaction(STORE_IMAGES, 'readonly');
      const r = tx.objectStore(STORE_IMAGES).get(id);
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  async function deleteImage(id) {
    const db = await openDB();
    return new Promise(function (res, rej) {
      const tx = db.transaction(STORE_IMAGES, 'readwrite');
      tx.objectStore(STORE_IMAGES).delete(id);
      tx.oncomplete = function () { res(); };
      tx.onerror = function () { rej(tx.error); };
    });
  }
  async function getAllImages() {
    const db = await openDB();
    return new Promise(function (res, rej) {
      const tx = db.transaction(STORE_IMAGES, 'readonly');
      const r = tx.objectStore(STORE_IMAGES).getAllKeys();
      r.onsuccess = async function () {
        const keys = r.result;
        const out = {};
        for (const k of keys) { out[k] = await getImage(k); }
        res(out);
      };
      r.onerror = function () { rej(r.error); };
    });
  }

  // ---------- Backup ----------
  function blobToBase64(blob) {
    return new Promise(function (res, rej) {
      const fr = new FileReader();
      fr.onload = function () {
        const result = fr.result;
        res(result.split(',')[1]);
      };
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  }
  async function exportAll() {
    const images = await getAllImages();
    const imgOut = {};
    for (const k of Object.keys(images)) {
      const blob = images[k];
      if (blob) { imgOut[k] = { type: blob.type, data: await blobToBase64(blob) }; }
    }
    return JSON.stringify({
      app: 'kidney-stone-helper',
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: getProfile(),
      timeline: getTimeline(),
      reports: getReports(),
      images: imgOut
    }, null, 2);
  }
  async function importAll(jsonStr) {
    const data = JSON.parse(jsonStr);
    if (data.profile) localStorage.setItem(LS_PROFILE, JSON.stringify(data.profile));
    if (Array.isArray(data.timeline)) localStorage.setItem(LS_TIMELINE, JSON.stringify(data.timeline));
    if (Array.isArray(data.reports)) localStorage.setItem(LS_REPORTS, JSON.stringify(data.reports));
    if (data.images) {
      for (const k of Object.keys(data.images)) {
        const b = data.images[k];
        let blob = null;
        if (b && b.type && b.data) {
          const bin = atob(b.data);
          const arr = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          blob = new Blob([arr], { type: b.type });
        }
        if (blob) await putImage(k, blob);
      }
    }
    return true;
  }

  const Store = {
    uid: uid, todayStr: todayStr, nowTime: nowTime,
    getProfile: getProfile, saveProfile: saveProfile,
    getTimeline: getTimeline, addEvent: addEvent, updateEvent: updateEvent,
    deleteEvent: deleteEvent, getEventsByDate: getEventsByDate,
    getReports: getReports, addReport: addReport, deleteReport: deleteReport,
    putImage: putImage, getImage: getImage, deleteImage: deleteImage,
    exportAll: exportAll, importAll: importAll,
    getAIConfig: getAIConfig, saveAIConfig: saveAIConfig
  };
  global.Store = Store;
})(window);

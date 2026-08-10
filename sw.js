// sw.js - 离线缓存，使应用可"安装"并离线使用
const CACHE = 'ks-helper-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/store.js',
  './js/knowledge.js',
  './js/advice.js',
  './js/app.js',
  './icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // 跨域请求（如AI接口）直接放行
  // 网络优先：保证每次都拿到最新代码；离线时回退到缓存
  e.respondWith(
    fetch(e.request).then(function (resp) {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        const copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return resp;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});

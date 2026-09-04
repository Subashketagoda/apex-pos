const CACHE_NAME = 'apexpos-pwa-v10';
const ASSETS = [
  './',
  './index.html',
  './login.html',
  './receipt.html',
  './customer.html',
  './style.css?v=32',
  './app.js?v=32',
  './db.js?v=32',
  './firebase-config.js?v=32',
  './manifest.json',
  './lib/lucide.min.js',
  './lib/chart.umd.js',
  './lib/firebase-app-compat.js',
  './lib/firebase-auth-compat.js',
  './lib/firebase-firestore-compat.js',
  './lib/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).catch(err => console.warn('[PWA] Cache install error:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[PWA] Purging outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Network-First for dynamic app scripts & views so updates apply immediately
  const isAppFile = url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname.endsWith('.css') || url.pathname === '/';

  if (isAppFile) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Cache-First for static assets (fonts, icons, vendor libraries)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});

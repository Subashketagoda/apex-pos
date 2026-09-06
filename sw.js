const CACHE_NAME = 'apexpos-pwa-v18';
const ASSETS = [
  './',
  './index.html',
  './login.html',
  './receipt.html',
  './customer.html',
  './style.css?v=38',
  './app.js?v=38',
  './db.js?v=38',
  './firebase-config.js?v=38',
  './manifest.json',
  './lib/lucide.min.js',
  './lib/chart.umd.js',
  './lib/firebase-app-compat.js',
  './lib/firebase-auth-compat.js',
  './lib/firebase-firestore-compat.js',
  './lib/icon.svg',
  './lib/icon-192.png',
  './lib/icon-512.png'
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

  // Do not intercept Firestore, Firebase Auth, or external Google API data requests
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('apis.google.com')
  ) {
    return;
  }

  // 1. CACHE-FIRST: Static vendor libraries & media assets (fonts, icons, vendor scripts)
  const isVendorOrMedia = 
    url.pathname.includes('/lib/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isVendorOrMedia) {
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
    return;
  }

  // 2. STALE-WHILE-REVALIDATE: Dynamic App Assets (HTML, CSS, App JS)
  // Delivers instant (0ms) render from local cache while silently updating in the background
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch((err) => {
        // Network offline or failed
        if (!cachedResponse && event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./login.html');
        }
        return null;
      });

      // If cached, return immediately for instant response; background fetch updates cache
      return cachedResponse || fetchPromise;
    })
  );
});

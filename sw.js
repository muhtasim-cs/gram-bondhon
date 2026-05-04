/* ============================================================
   GRAM-BONDHON — SERVICE WORKER
   Caches core assets for offline use
   ============================================================ */

const CACHE_NAME = 'gram-bondhon-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/market.html',
  '/women.html',
  '/dashboard.html',
  '/css/styles.css',
  '/css/animations.css',
  '/css/fallback.css',
  '/css/pages.css',
  '/css/mobile.css',
  '/js/main.js',
  '/js/chatbot.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Only handle GET requests for same-origin resources
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    }).catch(() => caches.match('/index.html'))
  );
});

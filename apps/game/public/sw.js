// Increment version whenever pushing new updates
const CACHE_NAME = 'nganya-surfers-v2';

const STATIC_PRECACHE = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png'
];

// Install: Skip waiting immediately so new worker takes over without waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE);
    })
  );
});

// Activate: Delete all previous cache versions & claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message listener to allow client to trigger immediate activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Strategy:
// 1. Navigation / HTML requests: NETWORK-FIRST (Always fetch latest code if online, fallback to cache if offline)
// 2. Static hashed assets (/assets/*, fonts, icons): CACHE-FIRST with network fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Ignore non-GET, API endpoints, or cross-origin extension requests
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin) || req.url.includes('/api/')) {
    return;
  }

  const isNavigation = req.mode === 'navigate' ||
    req.destination === 'document' ||
    req.url === self.location.origin + '/' ||
    req.url.endsWith('index.html');

  if (isNavigation) {
    // NETWORK-FIRST for HTML / App shell: Guarantees phones always get the latest deployment
    event.respondWith(
      fetch(req).then((networkResp) => {
        if (networkResp && networkResp.status === 200) {
          const respClone = networkResp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone));
        }
        return networkResp;
      }).catch(() => {
        // Offline fallback if no internet connection
        return caches.match(req).then((cached) => cached || caches.match('/index.html'));
      })
    );
    return;
  }

  // CACHE-FIRST for static hashed assets and assets
  event.respondWith(
    caches.match(req).then((cachedResp) => {
      if (cachedResp) {
        return cachedResp;
      }
      return fetch(req).then((networkResp) => {
        if (networkResp && networkResp.status === 200) {
          const respClone = networkResp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone));
        }
        return networkResp;
      });
    })
  );
});

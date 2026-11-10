const CACHE_NAME = 'nganya-surfers-v1';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png'
];

// Install: precache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-while-revalidate for assets, network-first for documents
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Ignore non-GET or cross-origin extension requests
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cachedResp) => {
      const fetchPromise = fetch(req).then((networkResp) => {
        if (networkResp && networkResp.status === 200) {
          const respToCache = networkResp.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, respToCache);
          });
        }
        return networkResp;
      }).catch(() => {
        // Offline fallback if fetch fails
        return cachedResp;
      });

      // Return cached version immediately if available, otherwise wait for network
      return cachedResp || fetchPromise;
    })
  );
});

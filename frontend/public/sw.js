const CACHE_NAME = 'qrsec-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
    )
  );
});

self.addEventListener('fetch', (event) => {
  // Try network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Optionally update cache for navigation requests
        if (event.request.mode === 'navigate') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('/')))
  );
});

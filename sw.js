const CACHE_NAME = 'receipt-scanner-v3';
const OFFLINE_ASSETS = [
  './scanner.html',
  './manifest.json',
  './index.html',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'
];

self.addEventListener('install', event => {
  console.log('[SW] Install v2');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        OFFLINE_ASSETS.map(url =>
          cache.add(url).catch(err => console.log('[SW] skip ' + url + ': ' + err))
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activate v2');
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.url.includes('proverkacheka.com')) return;
  if (req.url.includes('/upload')) return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        fetch(req).then(resp => {
          if (resp && resp.ok && req.url.startsWith(self.location.origin)) {
            caches.open(CACHE_NAME).then(c => c.put(req, resp.clone()));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(req).then(resp => {
        if (resp && resp.ok && req.url.startsWith(self.location.origin)) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return resp;
      }).catch(() => new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } }));
    })
  );
});

self.addEventListener('message', event => {
  console.log('[SW] Message:', event.data);
});

const CACHE_NAME = 'receipt-scanner-v5';
const OFFLINE_ASSETS = [
  './scanner.html',
  './manifest.json',
  './index.html',
  './jsQR.js'
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
  if (!req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(resp => {
        if (resp && resp.ok) {
          caches.open(CACHE_NAME).then(c => c.put(req, resp.clone()));
        }
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('message', event => {
  console.log('[SW] Message:', event.data);
});

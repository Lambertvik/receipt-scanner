const CACHE_NAME = 'receipt-scanner-v1';
const urlsToCache = [
  '/scanner.html',
  '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('[SW] Cache error:', err);
      })
  );
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(error => {
          console.log('[SW] Fetch error:', error);
          return new Response('Offline');
        });
      })
  );
});

// Обработка сообщений от клиента
self.addEventListener('message', event => {
  console.log('[SW] Message:', event.data);
});
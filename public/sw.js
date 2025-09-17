// This is a basic service worker that enables PWA installation.

const CACHE_NAME = 'hol-manager-cache-v1';
// IMPORTANT: Paths to icons must be correct.
const CACHE_FILES = [
  '/login',
  '/manifest.json',
  '/icon/icon-192x192.png',
  '/icon/icon-512x512.png'
];

// On install, cache the core files.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching files on install');
      return cache.addAll(CACHE_FILES);
    })
  );
});

// On activate, clean up old caches.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// On fetch, use a cache-first strategy.
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log('[Service Worker] Returning from cache:', event.request.url);
        return response;
      }
      console.log('[Service Worker] Fetching from network:', event.request.url);
      return fetch(event.request);
    })
  );
});

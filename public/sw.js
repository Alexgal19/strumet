// This is a basic Service Worker that enables PWA installation and provides an offline fallback.

const CACHE_NAME = 'hol-manager-cache-v1';
const CACHE_FILES = [
  '/login',
  '/manifest.json',
  '/icon/icon-192x192.png',
  '/icon/icon-512x512.png',
];

// On install, cache the core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching files');
      return cache.addAll(CACHE_FILES);
    })
  );
});

// On fetch, use a cache-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Not in cache - fetch from network
      return fetch(event.request);
    })
  );
});

// On activate, clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

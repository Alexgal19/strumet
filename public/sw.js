// public/sw.js

const CACHE_NAME = 'baza-st-cache-v2'; // Increment version to force update

// On install, perform setup.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Skip waiting to activate new service worker immediately.
  event.waitUntil(self.skipWaiting());
});

// On activate, clean up old caches.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all pages immediately.
  );
});

// On fetch, serve from cache, falling back to network.
self.addEventListener('fetch', (event) => {
  // For navigation requests, use a network-first strategy.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/')) // Fallback to a root page if offline
    );
    return;
  }

  // For other requests (assets), use a cache-first strategy.
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Optionally, cache new assets as they are fetched.
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});

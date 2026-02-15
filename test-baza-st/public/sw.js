// Service Worker - Network falling back to Cache strategy

const CACHE_NAME = 'baza-st-cache-v2'; // Bump version to clear old cache

// On install, activate immediately
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(self.skipWaiting());
});

// On activate, clean up old caches and take control
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// On fetch, apply the network-first strategy
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    // For non-GET requests, just use the network.
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    // Strategy: Network falling back to Cache
    fetch(event.request)
      .then(response => {
        // If the network request was successful, clone the response and cache it.
        // We only cache basic, successful (status 200) responses. This avoids
        // caching opaque responses from cross-origin redirects (like auth pages).
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // If the network request fails (e.g., offline), try to find a match in the cache.
        console.log('Service Worker: Network request failed, trying cache for', event.request.url);
        return caches.match(event.request)
          .then(response => {
            // If a match is found in the cache, return it.
            // Otherwise, the browser will handle the failure with its default error page.
            return response;
          });
      })
  );
});

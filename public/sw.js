const CACHE_NAME = 'hol-manager-cache-v2';
const CACHE_FILES = [
    '/',
    '/login',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache and caching files');
                return cache.addAll(CACHE_FILES);
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // We only want to handle navigation requests for this strategy
    if (event.request.mode !== 'navigate') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache-first strategy
                if (response) {
                    return response;
                }

                return fetch(event.request).then((networkResponse) => {
                    // Optional: You could cache the new page here if you want
                    return networkResponse;
                }).catch(() => {
                    // If both cache and network fail, return a generic fallback page
                    // or just the cached root page.
                    return caches.match('/login');
                });
            })
    );
});

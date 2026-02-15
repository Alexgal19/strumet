// public/sw.js
const CACHE_NAME = 'baza-st-cache-v5'; // Zwiększona wersja, aby wyczyścić stary cache

// Instalacja: Nowy Service Worker jest gotowy do aktywacji.
self.addEventListener('install', event => {
  console.log('[Service Worker] Install event - new version');
  // Wymusza aktywację nowego Service Workera natychmiast
  event.waitUntil(self.skipWaiting());
});

// Aktywacja: Czyszczenie starych wersji pamięci podręcznej.
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate event');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    }).then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim(); // Przejmuje kontrolę nad wszystkimi otwartymi klientami
    })
  );
});

// Fetch: Przechwytywanie żądań sieciowych.
self.addEventListener('fetch', event => {
  const { request } = event;

  // --- KLUCZOWA POPRAWKA ---
  // Obsługuj tylko żądania pochodzące z tej samej domeny.
  // To zapobiega błędom CORS z żądaniami cross-origin (np. uwierzytelnianie).
  if (!request.url.startsWith(self.location.origin)) {
    return; // Pozwól przeglądarce obsłużyć żądanie normalnie.
  }
  
  // --- Strategia: Network Falling Back to Cache ---
  event.respondWith(
    fetch(request)
      .then(response => {
        // Jeśli otrzymamy prawidłową odpowiedź z sieci, zapisz ją w cache i zwróć.
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Jeśli żądanie sieciowe zawiedzie, spróbuj pobrać odpowiedź z cache.
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Jeśli zasobu nie ma w cache, przeglądarka wyświetli domyślną stronę błędu.
        });
      })
  );
});

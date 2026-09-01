// ==========================================
// Cakekulator - Service Worker para Soporte Offline & Push
// ==========================================

const CACHE_NAME = 'cakekulator-v3.7';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/firebase-config.js',
  './js/auth.js',
  './js/templates.js',
  './js/db.js',
  './js/notifications.js',
  './js/ingredients.js',
  './js/receipt-scanner.js',
  './js/recipe-scanner.js',
  './js/market-radar.js',
  './js/receipts.js',
  './js/recipes.js',
  './js/simulator.js',
  './js/quotes.js',
  './js/customers.js',
  './js/app.js',
  './assets/icons/logo.png',
  './assets/icons/favicon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

// Instalación y almacenamiento en caché de archivos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precargando archivos en caché v3.5');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia Network First con Cache Fallback para garantizar siempre la última versión online
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// Soporte para Notificaciones Push Web genéricas / FCM
self.addEventListener('push', (event) => {
  let title = 'Cakekulator';
  let options = {
    body: 'Tienes una nueva notificación de tu taller pastelero.',
    icon: 'assets/icons/icon-192.png',
    badge: 'assets/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: './' }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.notification?.title || data.title || title;
      options.body = data.notification?.body || data.body || options.body;
      if (data.notification?.icon || data.icon) options.icon = data.notification?.icon || data.icon;
      if (data.data) options.data = data.data;
    } catch (e) {
      options.body = event.data.text() || options.body;
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Apertura al interactuar con la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) ? event.notification.data.url : './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') || client.url.endsWith('/') || client.url.includes(self.location.origin)) {
          if ('focus' in client) return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

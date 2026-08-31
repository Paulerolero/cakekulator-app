// ==========================================================
// Cakekulator - Firebase Cloud Messaging Service Worker (FCM)
// Permite recibir notificaciones push en segundo plano
// ==========================================================

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Inicializar Firebase en el Service Worker con la configuración por defecto
firebase.initializeApp({
  apiKey: "AIzaSyBiskv-QsWuvLtUFpwRPsHBxN8b02jB1bo",
  authDomain: "cakekulator-bd.firebaseapp.com",
  projectId: "cakekulator-bd",
  storageBucket: "cakekulator-bd.firebasestorage.app",
  messagingSenderId: "447811822569",
  appId: "1:447811822569:web:13ea8f3231a810053e2178"
});

const messaging = firebase.messaging();

// Manejador de notificaciones cuando la app está en segundo plano o cerrada
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje push recibido en background:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Cakekulator';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Tienes una nueva alerta en Cakekulator',
    icon: payload.notification?.icon || payload.data?.icon || 'assets/icons/icon-192.png',
    badge: 'assets/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || payload.fcmOptions?.link || './',
      ...payload.data
    },
    actions: [
      { action: 'open', title: 'Abrir App 🎂' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Evento al hacer clic en la notificación push
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = (event.notification.data && event.notification.data.url) ? event.notification.data.url : './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') || client.url.endsWith('/') || client.url.includes(self.location.origin)) {
          if ('focus' in client) {
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

/**
 * Firebase Cloud Messaging Service Worker for ZESTRO
 * Handles background push notifications when browser tab is closed/inactive
 */

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDFgcfvkXpSs0SH8yCWm8N6cl-yN-BZZNQ",
  authDomain: "zestro-fad9b.firebaseapp.com",
  projectId: "zestro-fad9b",
  storageBucket: "zestro-fad9b.firebasestorage.app",
  messagingSenderId: "635089199995",
  appId: "1:635089199995:web:b43cdddd23213d182c53de"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background push messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const title = payload.notification?.title || payload.data?.title || 'ZESTRO Dining Alert';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'You have a new update on your table or order.',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open_booking', title: 'View Details' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  self.registration.showNotification(title, options);
});

// Click listener to focus/open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickAction = event.notification.data?.clickAction || event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && clickAction) {
            client.navigate(clickAction);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});

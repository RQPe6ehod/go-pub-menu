// GO pub — shared service worker for all four staff interfaces.
// Handles Web Push events (works even when the app isn't open) and
// focuses/opens the app when a notification is tapped.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = { title: 'GO pub', body: 'Новое уведомление' };
  try { if (event.data) data = event.data.json(); } catch (e) {}

  const options = {
    body: data.body || '',
    tag: 'gopub-notify-' + Date.now(),
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(data.title || 'GO pub', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});

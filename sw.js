// GO pub — shared service worker for all four staff interfaces.
// Handles Web Push events (works even when the app isn't open) and
// focuses/opens the app when a notification is tapped.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// No offline caching — and deliberately NOT calling event.respondWith()
// here. Some browsers (notably Samsung Internet) require *a* fetch
// listener to be registered before they'll offer a real "Add to Home
// Screen" install, but actually intercepting every request and re-fetching
// it ourselves adds a real point of failure (a single flaky network blip
// during install can surface as "Download failed"). Leaving respondWith()
// uncalled means every request just falls through to the browser's normal
// handling, unaffected — the listener's mere presence is what satisfies
// the installability check.
self.addEventListener('fetch', () => {});

self.addEventListener('push', (event) => {
  let data = { title: 'GO pub', body: 'Новое уведомление', url: '/' };
  try { if (event.data) data = event.data.json(); } catch (e) {}

  const options = {
    body: data.body || '',
    tag: 'gopub-notify-' + Date.now(),
    vibrate: [200, 100, 200],
    requireInteraction: false,
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(data.title || 'GO pub', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          if ('navigate' in client) {
            try { client.navigate(targetUrl); } catch (e) { /* some browsers restrict cross-page navigate — fall through to focus anyway */ }
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

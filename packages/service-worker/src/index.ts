import onFetch from './onFetch';

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('fetch', onFetch);
self.addEventListener('push', (event: PushEvent) => {
  if (event.data) {
    const { title, ...options } = event.data.json() as NotificationOptions & { title: string };
    self.registration.showNotification(title, options);
  }
});

self.addEventListener('notificationclick', () => {
  self.clients.openWindow(self.registration.scope);
});

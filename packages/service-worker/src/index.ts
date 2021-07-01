import { onFetch } from './onFetch';

declare const self: ServiceWorkerGlobalScope;
declare const serviceWorkerOption: String[];

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

self.addEventListener('message', (event) => {
  event.waitUntil(
    caches.open('appsemble').then((cache) => cache.addAll([...serviceWorkerOption, ...event.data])),
  );
});

self.addEventListener('install', () =>
  // Activate worker immediately
  // We need to do this in order to have access to postMessage() within the client.
  self.skipWaiting(),
);

self.addEventListener('activate', () =>
  // Become available to all pages
  self.clients.claim(),
);

import { onFetch } from './onFetch.js';

declare const self: ServiceWorkerGlobalScope;
declare const appAssets: { url: string }[];
declare const blockAssets: string[];

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

self.addEventListener('install', (event) =>
  event.waitUntil(
    caches
      .open('appsemble')
      .then((cache) => cache.addAll([...appAssets.map((entry) => entry.url), ...blockAssets])),
  ),
);

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

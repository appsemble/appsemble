import makeServiceWorkerEnv from 'service-worker-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface MockServiceWorkerGlobal {
  listeners: Map<string, Set<(event: NotificationEvent) => void>>;
  NotificationEvent: typeof NotificationEvent;
  appAssets: { url: string }[];
  clients: Clients;
  registration: ServiceWorkerRegistration;
  trigger: (event: string, init?: unknown) => Promise<void>;
}

const serviceWorkerGlobal = globalThis as typeof globalThis & MockServiceWorkerGlobal;

function setRegistrationScope(scope: string): void {
  Object.defineProperty(serviceWorkerGlobal.registration, 'scope', {
    configurable: true,
    value: scope,
  });
}

async function triggerNotificationClick(notification: Notification): Promise<void> {
  const event = new serviceWorkerGlobal.NotificationEvent('notificationclick', {
    notification,
  }) as NotificationEvent & { promise: Promise<unknown> };
  const [listener] = serviceWorkerGlobal.listeners.get('notificationclick') ?? [];
  listener(event);
  await event.promise;
}

describe('service worker install', () => {
  beforeEach(() => {
    vi.resetModules();
    const env = makeServiceWorkerEnv();
    Object.assign(serviceWorkerGlobal, env);
    serviceWorkerGlobal.appAssets = [{ url: '/_/main.js' }, { url: '/core.css' }];
  });

  it('should precache only app assets during install', async () => {
    const addAll = vi.fn().mockResolvedValue('cached');
    const open = vi.fn().mockResolvedValue({ addAll });

    caches.open = open as typeof caches.open;

    await import('./index.js');

    await serviceWorkerGlobal.trigger('install');

    expect(open).toHaveBeenCalledWith('appsemble');
    expect(addAll).toHaveBeenCalledWith(['/_/main.js', '/core.css']);
  });

  it('should notify open clients when a push notification is received', async () => {
    const showNotification = vi.fn(() => Promise.resolve());
    const postMessage = vi.fn();
    const matchAll = vi.fn().mockResolvedValue([{ postMessage }]);

    serviceWorkerGlobal.registration.showNotification =
      showNotification as typeof serviceWorkerGlobal.registration.showNotification;
    serviceWorkerGlobal.clients.matchAll = matchAll as typeof serviceWorkerGlobal.clients.matchAll;

    await import('./index.js');

    await serviceWorkerGlobal.trigger('push', {
      data: {
        json: () => ({ title: 'New feedback', body: 'Please review', link: 'feedback' }),
      },
    });

    expect(showNotification).toHaveBeenCalledWith('New feedback', {
      body: 'Please review',
      link: 'feedback',
      data: { body: 'Please review', link: 'feedback' },
    });
    expect(matchAll).toHaveBeenCalledWith({ type: 'window', includeUncontrolled: true });
    expect(postMessage).toHaveBeenCalledWith({
      type: 'appsemble.notification',
      notification: { title: 'New feedback', body: 'Please review', link: 'feedback' },
    });
  });

  it('should append UTM source when opening notification links', async () => {
    const close = vi.fn();
    const openWindow = vi.fn();
    const matchAll = vi.fn().mockResolvedValue([]);

    setRegistrationScope('https://example.com/app/en/');
    serviceWorkerGlobal.clients.matchAll = matchAll as typeof serviceWorkerGlobal.clients.matchAll;
    serviceWorkerGlobal.clients.openWindow =
      openWindow as typeof serviceWorkerGlobal.clients.openWindow;

    await import('./index.js');

    await triggerNotificationClick({
      close,
      data: { link: 'feedback' },
    } as unknown as Notification);

    expect(close).toHaveBeenCalledWith();
    expect(openWindow).toHaveBeenCalledWith(
      'https://example.com/app/en/feedback?utm_source=notification',
    );
  });

  it('should preserve the service worker scope for leading slash notification links', async () => {
    const close = vi.fn();
    const openWindow = vi.fn();
    const matchAll = vi.fn().mockResolvedValue([]);

    setRegistrationScope('https://example.com/app/en/');
    serviceWorkerGlobal.clients.matchAll = matchAll as typeof serviceWorkerGlobal.clients.matchAll;
    serviceWorkerGlobal.clients.openWindow =
      openWindow as typeof serviceWorkerGlobal.clients.openWindow;

    await import('./index.js');

    await triggerNotificationClick({
      close,
      data: { link: '/feedback' },
    } as unknown as Notification);

    expect(close).toHaveBeenCalledWith();
    expect(openWindow).toHaveBeenCalledWith(
      'https://example.com/app/en//feedback?utm_source=notification',
    );
  });
});

// CSpell:ignore cooldown
import { act, render, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as ServiceWorkerRegistrationProviderModule from './index.js';

const { ServiceWorkerRegistrationProvider, useServiceWorkerRegistration } =
  ServiceWorkerRegistrationProviderModule;

const { axiosGet, requestUse, requestEject, getUri } = vi.hoisted(() => ({
  axiosGet: vi.fn(),
  requestUse: vi.fn(),
  requestEject: vi.fn(),
  getUri: vi.fn((config: { url: string }) => config.url),
}));

vi.mock('axios', () => ({
  default: {
    get: axiosGet,
    post: vi.fn(),
    patch: vi.fn(),
    getUri,
    interceptors: {
      request: {
        use: requestUse,
        eject: requestEject,
      },
    },
  },
}));

vi.mock('@sentry/browser', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

let latestContext: ReturnType<typeof useServiceWorkerRegistration> | undefined;
let requestInterceptor: ((config: { url: string }) => Promise<{ url: string }>) | undefined;
let serviceWorkerListeners: Record<string, (event: any) => void> = {};

function Consumer(): ReactNode {
  latestContext = useServiceWorkerRegistration();
  return null;
}

function renderProvider(serviceWorkerRegistration: ServiceWorkerRegistration | null): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <ServiceWorkerRegistrationProvider
        serviceWorkerRegistrationPromise={Promise.resolve(serviceWorkerRegistration)}
      >
        <Consumer />
      </ServiceWorkerRegistrationProvider>
    </IntlProvider>,
  );
}

function createRegistration({
  waiting,
}: { waiting?: ServiceWorker | null } = {}): ServiceWorkerRegistration {
  return {
    waiting: waiting ?? null,
    installing: null,
    onupdatefound: null,
    pushManager: {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn(),
    },
    update: vi.fn(() => Promise.resolve()),
  } as unknown as ServiceWorkerRegistration;
}

beforeEach(() => {
  vi.clearAllMocks();
  latestContext = undefined;
  requestInterceptor = undefined;
  serviceWorkerListeners = {};
  localStorage.clear();

  axiosGet.mockReset();
  axiosGet.mockResolvedValue({ headers: { 'x-appsemble-version': 'v1' } });
  requestUse.mockImplementation((callback) => {
    requestInterceptor = callback;
    return 1;
  });

  Object.defineProperty(globalThis, 'caches', {
    configurable: true,
    value: {
      delete: vi.fn().mockResolvedValue(true),
      keys: vi.fn().mockResolvedValue(['appsemble']),
    },
  });

  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller: {},
      addEventListener: vi.fn((type, listener) => {
        serviceWorkerListeners[type] = listener;
      }),
      removeEventListener: vi.fn((type, listener) => {
        if (serviceWorkerListeners[type] === listener) {
          delete serviceWorkerListeners[type];
        }
      }),
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ServiceWorkerRegistrationProvider', () => {
  it('should check for updates on startup without clearing caches', async () => {
    const registration = createRegistration();

    renderProvider(registration);

    await waitFor(() => expect(registration.update).toHaveBeenCalledTimes(1));
    expect(caches.keys).not.toHaveBeenCalled();
    expect(caches.delete).not.toHaveBeenCalled();
  });

  it('should throttle repeated version checks during the cooldown window', async () => {
    const registration = createRegistration();

    renderProvider(registration);

    await waitFor(() => expect(requestInterceptor).toBeTruthy());
    axiosGet.mockClear();

    await act(async () => {
      await requestInterceptor?.({ url: 'https://appsemble.app/api/apps/42/resources/tasks' });
      await requestInterceptor?.({ url: 'https://appsemble.app/api/apps/42/resources/updates' });
    });

    expect(axiosGet).not.toHaveBeenCalled();
    expect(registration.update).toHaveBeenCalledTimes(1);
  });

  it('should use SKIP_WAITING for an explicit update when a waiting worker exists', async () => {
    const waiting = { postMessage: vi.fn() } as unknown as ServiceWorker;
    const registration = createRegistration({ waiting });

    renderProvider(registration);
    await waitFor(() => expect(latestContext).toBeTruthy());
    vi.mocked(registration.update).mockClear();

    await act(async () => {
      await latestContext?.update();
    });

    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(registration.update).not.toHaveBeenCalled();
    expect(caches.keys).not.toHaveBeenCalled();
  });

  it('should fall back to registration.update for an explicit update when no waiting worker exists', async () => {
    const registration = createRegistration();

    renderProvider(registration);
    await waitFor(() => expect(latestContext).toBeTruthy());
    vi.mocked(registration.update).mockClear();

    await act(async () => {
      await latestContext?.update();
    });

    expect(registration.update).toHaveBeenCalledTimes(1);
    expect(caches.keys).not.toHaveBeenCalled();
  });

  it('should trigger cache clearing and update flow on version mismatch', async () => {
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValue(0);

    const waiting = { postMessage: vi.fn() } as unknown as ServiceWorker;
    const registration = createRegistration({ waiting });

    renderProvider(registration);
    await waitFor(() => expect(requestInterceptor).toBeTruthy());
    expect(localStorage.getItem('appsembleVersion')).toBe('v1');

    vi.mocked(waiting.postMessage).mockClear();
    axiosGet.mockClear();
    axiosGet.mockResolvedValueOnce({ headers: { 'x-appsemble-version': 'v2' } });
    nowSpy.mockReturnValue(60_001);

    await act(async () => {
      await requestInterceptor?.({ url: 'https://appsemble.app/api/apps/42/resources/tasks' });
    });

    expect(axiosGet).toHaveBeenCalledTimes(1);
    expect(caches.keys).toHaveBeenCalledTimes(1);
    expect(caches.delete).toHaveBeenCalledWith('appsemble');
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('should not clear caches or trigger update when the version did not change', async () => {
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValue(0);

    const waiting = { postMessage: vi.fn() } as unknown as ServiceWorker;
    const registration = createRegistration({ waiting });

    renderProvider(registration);
    await waitFor(() => expect(requestInterceptor).toBeTruthy());

    vi.mocked(waiting.postMessage).mockClear();
    axiosGet.mockClear();
    axiosGet.mockResolvedValueOnce({ headers: { 'x-appsemble-version': 'v1' } });
    nowSpy.mockReturnValue(60_001);

    await act(async () => {
      await requestInterceptor?.({ url: 'https://appsemble.app/api/apps/42/resources/tasks' });
    });

    expect(axiosGet).toHaveBeenCalledTimes(1);
    expect(caches.keys).not.toHaveBeenCalled();
    expect(caches.delete).not.toHaveBeenCalled();
    expect(waiting.postMessage).not.toHaveBeenCalled();
    expect(registration.update).toHaveBeenCalledTimes(1);
  });

  it('should not clear caches or trigger update when version lookup fails', async () => {
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValue(0);

    const waiting = { postMessage: vi.fn() } as unknown as ServiceWorker;
    const registration = createRegistration({ waiting });

    renderProvider(registration);
    await waitFor(() => expect(requestInterceptor).toBeTruthy());

    vi.mocked(waiting.postMessage).mockClear();
    axiosGet.mockClear();
    axiosGet.mockRejectedValueOnce(new Error('network error'));
    nowSpy.mockReturnValue(60_001);

    await act(async () => {
      await requestInterceptor?.({ url: 'https://appsemble.app/api/apps/42/resources/tasks' });
    });

    expect(axiosGet).toHaveBeenCalledTimes(1);
    expect(caches.keys).not.toHaveBeenCalled();
    expect(caches.delete).not.toHaveBeenCalled();
    expect(waiting.postMessage).not.toHaveBeenCalled();
    expect(registration.update).toHaveBeenCalledTimes(1);
  });

  it('should reload when a push notification targets the current page', async () => {
    const registration = createRegistration();
    const reloadSpy = vi
      .spyOn(ServiceWorkerRegistrationProviderModule.pageReloader, 'reload')
      .mockImplementation(vi.fn());

    window.history.pushState({}, '', '/nl/feedback');
    renderProvider(registration);

    await waitFor(() => expect(serviceWorkerListeners.message).toBeTruthy());

    await act(() => {
      serviceWorkerListeners.message?.({
        data: {
          type: 'appsemble.notification',
          notification: { link: 'feedback' },
        },
      });
    });

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('should ignore push notifications for another page', async () => {
    const registration = createRegistration();
    const reloadSpy = vi
      .spyOn(ServiceWorkerRegistrationProviderModule.pageReloader, 'reload')
      .mockImplementation(vi.fn());

    window.history.pushState({}, '', '/nl/updates');
    renderProvider(registration);

    await waitFor(() => expect(serviceWorkerListeners.message).toBeTruthy());

    await act(() => {
      serviceWorkerListeners.message?.({
        data: {
          type: 'appsemble.notification',
          notification: { link: 'feedback' },
        },
      });
    });

    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('should register a controllerchange listener on the service worker container', async () => {
    const registration = createRegistration();

    renderProvider(registration);

    await waitFor(() =>
      expect(navigator.serviceWorker.addEventListener).toHaveBeenCalledWith(
        'controllerchange',
        expect.any(Function),
      ),
    );
  });
});

import { act, render, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServiceWorkerRegistrationProvider, useServiceWorkerRegistration } from './index.js';

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
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
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

  it('should trigger update flow on version mismatch without clearing caches', async () => {
    const waiting = { postMessage: vi.fn() } as unknown as ServiceWorker;
    const registration = createRegistration({ waiting });

    renderProvider(registration);
    await waitFor(() => expect(requestInterceptor).toBeTruthy());
    expect(localStorage.getItem('appsembleVersion')).toBe('v1');

    vi.mocked(waiting.postMessage).mockClear();
    axiosGet.mockResolvedValueOnce({ headers: { 'x-appsemble-version': 'v2' } });

    await act(async () => {
      await requestInterceptor?.({ url: 'https://appsemble.app/api/apps/42/resources/tasks' });
    });

    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(caches.keys).not.toHaveBeenCalled();
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

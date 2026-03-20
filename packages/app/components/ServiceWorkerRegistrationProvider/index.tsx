import { ModalCard } from '@appsemble/react-components';
import { type ResourceSubscribableAction } from '@appsemble/types';
import { urlB64ToUint8Array } from '@appsemble/web-utils';
import { addBreadcrumb, captureException, captureMessage } from '@sentry/browser';
import axios from 'axios';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { type Permission, type ServiceWorkerRegistrationContextType } from '../../types.js';
import { apiUrl, appId, e2e, vapidPublicKey } from '../../utils/settings.js';

interface ServiceWorkerRegistrationProviderProps {
  readonly children: ReactNode;
  readonly serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration | null>;
}

// @ts-expect-error 2345 argument of type is not assignable to parameter of type (strictNullChecks)
const Context = createContext<ServiceWorkerRegistrationContextType>(null);

export function useServiceWorkerRegistration(): ServiceWorkerRegistrationContextType {
  return useContext(Context);
}

const apiVersionUrl = `${apiUrl}/api`;
const VERSION_CHECK_COOLDOWN_MS = 60_000;

export function ServiceWorkerRegistrationProvider({
  children,
  serviceWorkerRegistrationPromise,
}: ServiceWorkerRegistrationProviderProps): ReactNode {
  const [permission, setPermission] = useState<Permission>(window.Notification?.permission);
  const [subscription, setSubscription] = useState<PushSubscription | null>();
  const [serviceWorkerError, setServiceWorkerError] = useState<Error | null>(null);
  const hasReloadedForControllerChange = useRef(false);
  const lastVersionCheckAtRef = useRef(0);
  const versionCheckPromiseRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    const onControllerChange = (): void => {
      if (hasReloadedForControllerChange.current) {
        return;
      }
      hasReloadedForControllerChange.current = true;
      window.location.reload();
    };

    navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange);
    return () =>
      navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange);
  }, []);

  useEffect(() => {
    serviceWorkerRegistrationPromise
      .then((reg) => reg?.pushManager?.getSubscription())
      .then(setSubscription)
      .catch(setServiceWorkerError);
  }, [serviceWorkerRegistrationPromise]);

  const checkForUpdates = useCallback(async () => {
    try {
      const registration = await serviceWorkerRegistrationPromise;
      if (!registration) {
        return;
      }

      await registration.update();
    } catch (error) {
      setServiceWorkerError(error as Error);
    }
  }, [serviceWorkerRegistrationPromise]);

  const update = useCallback(async () => {
    try {
      const registration = await serviceWorkerRegistrationPromise;
      if (!registration) {
        return;
      }

      if (registration.waiting) {
        // eslint-disable-next-line unicorn/require-post-message-target-origin
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return;
      }

      await registration.update();
    } catch (error) {
      setServiceWorkerError(error as Error);
    }
  }, [serviceWorkerRegistrationPromise]);

  const checkLatestAppsembleVersion = useCallback(
    ({
      force = false,
      persist = false,
    }: { readonly force?: boolean; readonly persist?: boolean } = {}) => {
      const now = Date.now();

      if (!force) {
        if (versionCheckPromiseRef.current) {
          return versionCheckPromiseRef.current;
        }

        if (now - lastVersionCheckAtRef.current < VERSION_CHECK_COOLDOWN_MS) {
          return null;
        }
      }

      lastVersionCheckAtRef.current = now;
      const request = axios
        .get(apiVersionUrl)
        .then((res) => {
          const version = res.headers['x-appsemble-version'] as string | undefined;

          if (persist && version) {
            localStorage.setItem('appsembleVersion', version);
          }

          return version ?? null;
        })
        .catch((error: unknown) => {
          addBreadcrumb({
            category: 'appsemble.version-check',
            data: {
              error: error instanceof Error ? error.message : String(error),
            },
            level: 'warning',
          });

          return null;
        })
        .finally(() => {
          versionCheckPromiseRef.current = null;
        });

      versionCheckPromiseRef.current = request;

      return request;
    },
    [],
  );

  useEffect(() => {
    checkLatestAppsembleVersion({ force: true, persist: true });
  }, [checkLatestAppsembleVersion]);

  useEffect(() => {
    const interceptor = axios.interceptors.request.use(async (config) => {
      try {
        const url = new URL(axios.getUri(config));

        if (url.origin === apiUrl && url.href !== apiVersionUrl) {
          const appsembleVersion = localStorage.getItem('appsembleVersion');
          const newAppsembleVersion = await checkLatestAppsembleVersion();

          if (newAppsembleVersion) {
            localStorage.setItem('appsembleVersion', newAppsembleVersion);
          }

          if (appsembleVersion && newAppsembleVersion && appsembleVersion !== newAppsembleVersion) {
            await update();
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Version check failed', error);
      }
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, [checkLatestAppsembleVersion, update]);

  useEffect(() => {
    serviceWorkerRegistrationPromise
      .then((registration) => {
        if (!registration) {
          return;
        }

        // Listen for new SW installation
        // eslint-disable-next-line no-param-reassign
        registration.onupdatefound = () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.onstatechange = () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // eslint-disable-next-line unicorn/require-post-message-target-origin
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            };
          }
        };

        return checkForUpdates();
      })
      .catch(setServiceWorkerError);
  }, [checkForUpdates, serviceWorkerRegistrationPromise]);

  // Poll for updates every hour
  useEffect(() => {
    const interval = setInterval(checkForUpdates, 60 * 60_000);
    return () => clearInterval(interval);
  }, [checkForUpdates]);

  const requestPermission = useCallback(async () => {
    if (window.Notification?.permission === 'default') {
      setPermission('pending');
    }

    const newPermission = await window.Notification?.requestPermission();
    setPermission(newPermission);

    return newPermission;
  }, []);

  const subscribe = useCallback(
    async (
      resourceActionsToSubscribeTo: {
        resourceType: string;
        action: ResourceSubscribableAction;
      }[] = [],
    ) => {
      const registration = await serviceWorkerRegistrationPromise;
      if (!registration) {
        return null;
      }

      if (window.Notification?.permission !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          return null;
        }
      }

      let sub = await registration.pushManager.getSubscription();

      if (!sub) {
        const options = {
          applicationServerKey: urlB64ToUint8Array(vapidPublicKey),
          userVisibleOnly: true,
        };

        sub = await registration.pushManager.subscribe(options);
        const { endpoint, keys } = sub.toJSON();
        await axios.post(`${apiUrl}/api/apps/${appId}/subscriptions`, { endpoint, keys });

        for (const { action, resourceType } of resourceActionsToSubscribeTo) {
          await axios.patch(`${apiUrl}/api/apps/${appId}/subscriptions`, {
            endpoint,
            resource: resourceType,
            action,
            value: true,
          });
        }
      }

      setSubscription(sub);

      return sub;
    },
    [requestPermission, serviceWorkerRegistrationPromise],
  );

  const unsubscribe = useCallback(async () => {
    if (!subscription) {
      return false;
    }
    const result = await subscription.unsubscribe();
    setSubscription(null);
    return result;
  }, [subscription]);

  const value = useMemo(
    () => ({
      subscribe,
      subscription,
      requestPermission,
      permission,
      unsubscribe,
      update,
    }),
    [permission, requestPermission, subscribe, subscription, unsubscribe, update],
  );

  useEffect(() => {
    if (serviceWorkerError) {
      captureMessage('Unexpected service worker error.');
      captureException(serviceWorkerError);
    }
  }, [serviceWorkerError]);

  const clearServiceWorkerError = useCallback(
    () => setServiceWorkerError(null),
    [setServiceWorkerError],
  );

  return (
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    <Context.Provider value={value}>
      {serviceWorkerError && !e2e ? (
        <ModalCard
          isActive={Boolean(serviceWorkerError)}
          onClose={clearServiceWorkerError}
          title={<FormattedMessage {...messages.serviceWorkerError} />}
        >
          <FormattedMessage {...messages.error} />
        </ModalCard>
      ) : null}
      {children}
    </Context.Provider>
  );
}

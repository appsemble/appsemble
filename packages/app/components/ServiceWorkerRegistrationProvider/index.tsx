import { ModalCard } from '@appsemble/react-components';
import { type ResourceSubscribableAction } from '@appsemble/types';
import { urlB64ToUint8Array } from '@appsemble/web-utils';
import axios from 'axios';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { type Permission, type ServiceWorkerRegistrationContextType } from '../../types.js';
import { apiUrl, appId, e2e, vapidPublicKey } from '../../utils/settings.js';

interface ServiceWorkerRegistrationProviderProps {
  readonly children: ReactNode;
  readonly serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration>;
}

// @ts-expect-error 2345 argument of type is not assignable to parameter of type (strictNullChecks)
const Context = createContext<ServiceWorkerRegistrationContextType>(null);

export function useServiceWorkerRegistration(): ServiceWorkerRegistrationContextType {
  return useContext(Context);
}

const apiVersionUrl = `${apiUrl}/api`;

export function ServiceWorkerRegistrationProvider({
  children,
  serviceWorkerRegistrationPromise,
}: ServiceWorkerRegistrationProviderProps): ReactNode {
  const [permission, setPermission] = useState<Permission>(window.Notification?.permission);
  const [subscription, setSubscription] = useState<PushSubscription | null>();
  const [serviceWorkerError, setServiceWorkerError] = useState<Error | null>(null);

  // Refresh when the new SW takes control
  useEffect(() => {
    navigator.serviceWorker?.addEventListener('controllerchange', () => window.location.reload());
  }, []);

  useEffect(() => {
    serviceWorkerRegistrationPromise
      .then((reg) => reg?.pushManager?.getSubscription())
      .then(setSubscription)
      .catch(setServiceWorkerError);
  }, [serviceWorkerRegistrationPromise]);

  const update = useCallback(async () => {
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      const registration = await serviceWorkerRegistrationPromise;
      if (registration?.waiting) {
        // eslint-disable-next-line unicorn/require-post-message-target-origin
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        // Trigger SW to check for updates
        await registration?.update();
      }
    } catch (error) {
      setServiceWorkerError(error as Error);
    }
  }, [serviceWorkerRegistrationPromise]);

  useEffect(() => {
    axios
      .get(apiVersionUrl)
      .then((res) => localStorage.setItem('appsembleVersion', res.headers['x-appsemble-version']));
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.request.use(async (config) => {
      try {
        const url = new URL(axios.getUri(config));
        if (url.origin === apiUrl && url.href !== apiVersionUrl) {
          const res = await axios.get(apiVersionUrl);
          const newAppsembleVersion = res.headers['x-appsemble-version'];
          const appsembleVersion = localStorage.getItem('appsembleVersion');
          if (appsembleVersion && appsembleVersion !== newAppsembleVersion) {
            await update();
            window.location.reload();
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Version check failed', error);
      }
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, [update]);

  useEffect(() => {
    serviceWorkerRegistrationPromise
      .then((registration) => {
        if (registration) {
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
        }

        // Kick off initial update
        update();
      })
      .catch(setServiceWorkerError);
  }, [serviceWorkerRegistrationPromise, update]);

  // Poll for updates every hour
  useEffect(() => {
    const interval = setInterval(update, 60 * 60_000);
    return () => clearInterval(interval);
  }, [serviceWorkerRegistrationPromise, update]);

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

      if (window.Notification?.permission !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          return null;
        }
      }

      let sub = await registration?.pushManager?.getSubscription();

      if (!sub) {
        const options = {
          applicationServerKey: urlB64ToUint8Array(vapidPublicKey),
          userVisibleOnly: true,
        };

        sub = await registration?.pushManager?.subscribe(options);
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

  const clearServiceWorkerError = useCallback(
    () => setServiceWorkerError(null),
    [setServiceWorkerError],
  );

  return (
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    <Context.Provider value={value}>
      {serviceWorkerError && !e2e ? (
        <ModalCard isActive={Boolean(serviceWorkerError)} onClose={clearServiceWorkerError}>
          <FormattedMessage {...messages.error} />
        </ModalCard>
      ) : null}
      {children}
    </Context.Provider>
  );
}

import { CardFooterButton, ModalCard } from '@appsemble/react-components';
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

export function ServiceWorkerRegistrationProvider({
  children,
  serviceWorkerRegistrationPromise,
}: ServiceWorkerRegistrationProviderProps): ReactNode {
  const [permission, setPermission] = useState<Permission>(window.Notification?.permission);
  const [subscription, setSubscription] = useState<PushSubscription | null>();
  const [serviceWorkerError, setServiceWorkerError] = useState<Error | null>(null);
  const [shouldUpdate, setShouldUpdate] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    serviceWorkerRegistrationPromise
      .then((registration) => {
        if (!registration) {
          return;
        }

        registration.update();

        // If a worker is already waiting, trigger the update prompt
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
          setShouldUpdate(true);
        }

        // eslint-disable-next-line no-param-reassign
        registration.onupdatefound = () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.onstatechange = () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available and waiting
                setWaitingWorker(newWorker);
                setShouldUpdate(true);
              }
            };
          }
        };

        return registration.pushManager?.getSubscription();
      })
      .then(setSubscription)
      .catch((error) => setServiceWorkerError(error));
  }, [serviceWorkerRegistrationPromise]);

  // Poll for updates every day
  useEffect(() => {
    const interval = setInterval(
      () => {
        serviceWorkerRegistrationPromise.then((reg) => {
          reg?.update();
        });
      },
      24 * 60 * 60_000,
    );
    return () => clearInterval(interval);
  }, [serviceWorkerRegistrationPromise]);

  // Refresh when the new SW takes control
  useEffect(() => {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, []);

  const update = useCallback(() => {
    serviceWorkerRegistrationPromise.then((reg) => {
      reg?.update();
    });
  }, [serviceWorkerRegistrationPromise]);

  const onUpdateConfirm = useCallback(() => {
    if (waitingWorker) {
      // eslint-disable-next-line unicorn/require-post-message-target-origin
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShouldUpdate(false);
      setWaitingWorker(null);
    }
  }, [waitingWorker]);

  const onUpdateCancel = useCallback(() => {
    setWaitingWorker(null);
    setShouldUpdate(false);
  }, []);

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
      {shouldUpdate ? (
        <ModalCard
          footer={
            <>
              <CardFooterButton onClick={onUpdateCancel}>
                <FormattedMessage {...messages.cancel} />
              </CardFooterButton>
              <CardFooterButton color="primary" onClick={onUpdateConfirm}>
                <FormattedMessage {...messages.confirm} />
              </CardFooterButton>
            </>
          }
          isActive={shouldUpdate}
          onClose={() => setShouldUpdate(false)}
        >
          <FormattedMessage {...messages.updateAvailable} />
        </ModalCard>
      ) : null}
      {children}
    </Context.Provider>
  );
}

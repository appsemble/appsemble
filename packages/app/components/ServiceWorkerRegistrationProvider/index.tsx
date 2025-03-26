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

import { type Permission, type ServiceWorkerRegistrationContextType } from '../../types.js';
import { apiUrl, appId, vapidPublicKey } from '../../utils/settings.js';

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

  useEffect(() => {
    serviceWorkerRegistrationPromise
      .then((registration) => registration?.pushManager?.getSubscription())
      .then(setSubscription);
  }, [serviceWorkerRegistrationPromise]);

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
    }),
    [permission, requestPermission, subscribe, subscription, unsubscribe],
  );

  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

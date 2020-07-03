import { urlB64ToUint8Array } from '@appsemble/web-utils';
import axios from 'axios';
import React, {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { Permission, ServiceWorkerRegistrationContextType } from '../../types';
import settings from '../../utils/settings';

interface ServiceWorkerRegistrationProviderProps {
  children: ReactNode;
  serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration>;
}

const ServiceWorkerRegistrationContext = createContext<ServiceWorkerRegistrationContextType>(null);

export function useServiceWorkerRegistration(): ServiceWorkerRegistrationContextType {
  return useContext(ServiceWorkerRegistrationContext);
}

export default function ServiceWorkerRegistrationProvider({
  children,
  serviceWorkerRegistrationPromise,
}: ServiceWorkerRegistrationProviderProps): ReactElement {
  const [permission, setPermission] = useState<Permission>(window.Notification?.permission);
  const [subscription, setSubscription] = useState<PushSubscription>();

  useEffect(() => {
    serviceWorkerRegistrationPromise.then((registration) =>
      registration?.pushManager.getSubscription().then(setSubscription),
    );
  }, [serviceWorkerRegistrationPromise]);

  const requestPermission = useCallback(async () => {
    if (window.Notification?.permission === 'default') {
      setPermission('pending');
    }

    const newPermission = await window.Notification?.requestPermission();
    setPermission(newPermission);

    return newPermission;
  }, []);

  const subscribe = useCallback(async () => {
    const registration = await serviceWorkerRegistrationPromise;

    if (permission !== 'granted') {
      const newPermission = await requestPermission();
      if (newPermission !== 'granted') {
        return null;
      }
    }

    let sub = await registration?.pushManager?.getSubscription();

    if (!sub) {
      const { id, vapidPublicKey } = settings;
      const options = {
        applicationServerKey: urlB64ToUint8Array(vapidPublicKey),
        userVisibleOnly: true,
      };

      sub = await registration?.pushManager?.subscribe(options);
      const { endpoint, keys } = sub.toJSON();
      await axios.post(`${settings.apiUrl}/api/apps/${id}/subscriptions`, { endpoint, keys });
    }

    setSubscription(sub);

    return sub;
  }, [permission, requestPermission, serviceWorkerRegistrationPromise]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) {
      return false;
    }
    const result = subscription.unsubscribe();
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

  return (
    <ServiceWorkerRegistrationContext.Provider value={value}>
      {children}
    </ServiceWorkerRegistrationContext.Provider>
  );
}

import { urlB64ToUint8Array } from '@appsemble/web-utils';
import axios from 'axios';
import * as React from 'react';

import type { Permission, ServiceWorkerRegistrationContextType } from '../../types';
import settings from '../../utils/settings';

interface ServiceWorkerRegistrationProviderProps {
  children: React.ReactNode;
  serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration>;
}

const ServiceWorkerRegistrationContext = React.createContext<ServiceWorkerRegistrationContextType>(
  null,
);

export function useServiceWorkerRegistration(): ServiceWorkerRegistrationContextType {
  return React.useContext(ServiceWorkerRegistrationContext);
}

export default function ServiceWorkerRegistrationProvider({
  children,
  serviceWorkerRegistrationPromise,
}: ServiceWorkerRegistrationProviderProps): React.ReactElement {
  const [permission, setPermission] = React.useState<Permission>(window.Notification?.permission);
  const [subscription, setSubscription] = React.useState<PushSubscription>();

  React.useEffect(() => {
    serviceWorkerRegistrationPromise.then((registration) =>
      registration?.pushManager.getSubscription().then(setSubscription),
    );
  }, [serviceWorkerRegistrationPromise]);

  const requestPermission = React.useCallback(async () => {
    if (window.Notification?.permission === 'default') {
      setPermission('pending');
    }

    const newPermission = await window.Notification?.requestPermission();
    setPermission(newPermission);

    return newPermission;
  }, []);

  const subscribe = React.useCallback(async () => {
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

  const unsubscribe = React.useCallback(async () => {
    if (!subscription) {
      return false;
    }
    const result = subscription.unsubscribe();
    setSubscription(null);
    return result;
  }, [subscription]);

  const value = React.useMemo(
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

import { ReactElement, useEffect } from 'react';

import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';
import { useUser } from '../UserProvider/index.js';
import styles from './index.module.css';

/**
 * Render all different authentication methods for an app.
 */
export function PermissionRequest(): ReactElement {
  const { definition } = useAppDefinition();
  const { userInfo } = useUser();
  const { permission, requestPermission, subscribe } = useServiceWorkerRegistration();

  useEffect(() => {
    if (definition.notifications === 'opt-in') {
      return;
    }

    if (definition.notifications === 'login' && !userInfo?.sub) {
      return;
    }

    if (window.Notification?.permission === 'denied') {
      return;
    }

    if (definition.notifications !== 'startup') {
      return;
    }

    requestPermission().then((p) => {
      if (p === 'granted') {
        subscribe();
      }
    });
  }, [definition.notifications, requestPermission, subscribe, userInfo?.sub]);

  return permission === 'pending' ? <div className={`modal-background ${styles.overlay}`} /> : null;
}

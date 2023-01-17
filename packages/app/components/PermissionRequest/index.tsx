import { ReactElement, useEffect } from 'react';

import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';
import styles from './index.module.css';

/**
 * Render all different authentication methods for an app.
 */
export function PermissionRequest(): ReactElement {
  const { definition } = useAppDefinition();
  const { permission, requestPermission, subscribe } = useServiceWorkerRegistration();

  useEffect(() => {
    if (definition.notifications !== 'startup') {
      return;
    }

    if (window.Notification?.permission === 'denied') {
      return;
    }

    requestPermission().then((p) => {
      if (p === 'granted') {
        subscribe();
      }
    });
  }, [definition.notifications, requestPermission, subscribe]);

  return permission === 'pending' ? <div className={`modal-background ${styles.overlay}`} /> : null;
}

import { ReactElement } from 'react';

import { useAppDefinition } from '../AppDefinitionProvider';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider';
import styles from './index.module.css';

/**
 * Render all different authentication methods for an app.
 */
export function PermissionRequest(): ReactElement {
  const { definition } = useAppDefinition();
  const { permission, requestPermission, subscribe } = useServiceWorkerRegistration();

  if (definition.notifications && definition.notifications === 'startup') {
    if (window.Notification?.permission === 'denied') {
      return null;
    }

    requestPermission().then((p) => {
      if (p === 'granted') {
        subscribe();
      }
    });
  }

  return permission === 'pending' ? <div className={`modal-background ${styles.overlay}`} /> : null;
}

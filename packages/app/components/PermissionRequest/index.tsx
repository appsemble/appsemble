import { ReactElement } from 'react';

import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';
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

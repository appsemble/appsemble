import { AppDefinition } from '@appsemble/types';
import React from 'react';

import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider';
import styles from './PermissionRequest.css';

interface PermissionRequestProps {
  definition: AppDefinition;
}

/**
 * Render all different authentication methods for an app.
 */
export default function PermissionRequest({
  definition,
}: PermissionRequestProps): React.ReactElement {
  const { permission, requestPermission, subscribe } = useServiceWorkerRegistration();

  if (definition.notifications && definition.notifications === 'startup') {
    if (window.Notification.permission === 'denied') {
      return null;
    }

    requestPermission().then(p => {
      if (p === 'granted') {
        subscribe();
      }
    });
  }

  return permission === 'pending' ? <div className={`modal-background ${styles.overlay}`} /> : null;
}

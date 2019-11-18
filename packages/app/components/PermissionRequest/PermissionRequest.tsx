import { AppDefinition } from '@appsemble/types';
import React from 'react';

import { Permission } from '../../actions/serviceWorker';
import styles from './PermissionRequest.css';

export interface PermissionRequestProps {
  definition: AppDefinition;
  permission: Permission;
  subscribe: () => Promise<void>;
  requestPermission: () => Promise<Permission>;
}

/**
 * Render all different authentication methods for an app.
 */
export default function PermissionRequest({
  definition,
  permission,
  subscribe,
  requestPermission,
}: PermissionRequestProps): React.ReactElement {
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

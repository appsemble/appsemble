import { type ReactNode, useEffect } from 'react';

import styles from './index.module.css';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';

/**
 * Render all different authentication methods for an app.
 */
export function PermissionRequest(): ReactNode {
  const { definition } = useAppDefinition();
  const { appMemberInfo } = useAppMember();
  const { permission, requestPermission, subscribe } = useServiceWorkerRegistration();

  useEffect(() => {
    if (definition.notifications === 'opt-in') {
      return;
    }

    if (window.Notification?.permission === 'denied') {
      return;
    }

    if (
      definition.notifications === 'startup' ||
      (definition.notifications === 'login' && appMemberInfo?.sub)
    ) {
      requestPermission().then((p) => {
        if (p === 'granted') {
          subscribe();
        }
      });
    }
  }, [definition.notifications, requestPermission, subscribe, appMemberInfo?.sub]);

  return permission === 'pending' ? <div className={`modal-background ${styles.overlay}`} /> : null;
}

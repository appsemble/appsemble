import { type ReactNode, useEffect } from 'react';

import styles from './index.module.css';
import { getNotificationStrategy } from '../../utils/notifications.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';

/**
 * Render all different authentication methods for an app.
 */
export function PermissionRequest(): ReactNode {
  const { definition } = useAppDefinition();
  const { appMemberInfo, appMemberRoles } = useAppMember();
  const { permission, requestPermission, subscribe } = useServiceWorkerRegistration();
  const strategy = getNotificationStrategy(definition.notifications, appMemberRoles);

  useEffect(() => {
    if (strategy === 'opt-in') {
      return;
    }

    if (window.Notification?.permission === 'denied') {
      return;
    }

    if (strategy === 'startup' || (strategy === 'login' && appMemberInfo?.sub)) {
      requestPermission().then((p) => {
        if (p === 'granted') {
          subscribe();
        }
      });
    }
  }, [strategy, requestPermission, subscribe, appMemberInfo?.sub]);

  return permission === 'pending' ? <div className={`modal-background ${styles.overlay}`} /> : null;
}

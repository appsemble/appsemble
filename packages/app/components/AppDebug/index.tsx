import { Button, Content, useMeta } from '@appsemble/react-components';
import { type ReactNode, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { messages } from './messages.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { Main } from '../Main/index.js';
import { AppBar } from '../TitleBar/index.js';

interface ServiceWorkerStatus {
  available: boolean;
  reason?: string;
  registrations?: {
    scope: string;
    scriptURL: string;
    state: string;
  }[];
}

interface PWAStatus {
  installable: boolean;
  reason?: string;
}

interface PermissionStatusInfo {
  name: string;
  state: string;
  supported: boolean;
}

/**
 * Page containing debugging options for an app
 */
export function AppDebug(): ReactNode {
  useMeta(messages.debug);
  const { snapshotId } = useAppDefinition();
  const { logout } = useAppMember();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<ServiceWorkerStatus | null>(null);
  const [pwaStatus, setPwaStatus] = useState<PWAStatus | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<PermissionStatusInfo | null>(null);
  const [locationStatus, setLocationStatus] = useState<PermissionStatusInfo | null>(null);

  useEffect(() => {
    const checkServiceWorker = async (): Promise<void> => {
      if (!('serviceWorker' in navigator)) {
        setServiceWorkerStatus({
          available: false,
          reason: 'Service workers are not supported in this browser.',
        });
        return;
      }

      if (!window.isSecureContext) {
        setServiceWorkerStatus({
          available: false,
          reason: 'Service workers require a secure context (HTTPS).',
        });
        return;
      }

      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length === 0) {
          setServiceWorkerStatus({
            available: true,
            reason: 'No service worker is currently registered.',
            registrations: [],
          });
        } else {
          setServiceWorkerStatus({
            available: true,
            registrations: regs.map((reg) => ({
              scope: reg.scope,
              scriptURL:
                reg.active?.scriptURL ??
                reg.waiting?.scriptURL ??
                reg.installing?.scriptURL ??
                'unknown',
              state: reg.active?.state ?? reg.waiting?.state ?? reg.installing?.state ?? 'unknown',
            })),
          });
        }
      } catch (err) {
        setServiceWorkerStatus({
          available: false,
          reason: `Failed to check service worker registrations: ${
            err instanceof Error ? err.message : String(err)
          }`,
        });
      }
    };

    checkServiceWorker();
  }, []);

  useEffect(() => {
    const checkPWA = (): void => {
      if (!window.isSecureContext) {
        setPwaStatus({ installable: false, reason: 'PWAs require a secure context (HTTPS).' });
        return;
      }

      const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (!manifestLink) {
        setPwaStatus({
          installable: false,
          reason: 'No web app manifest found (<link rel="manifest"> missing).',
        });
        return;
      }

      if (!navigator.serviceWorker.controller) {
        setPwaStatus({
          installable: false,
          reason: 'No active service worker is controlling this page.',
        });
        return;
      }

      const ua = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(ua);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      const supportsPrompt = 'onbeforeinstallprompt' in window;

      if (supportsPrompt) {
        setPwaStatus({ installable: true });
        return;
      }

      if (isIOS && isSafari) {
        setPwaStatus({
          installable: false,
          reason:
            'Safari on iOS does not support install prompts. Use "Share → Add to Home Screen" instead.',
        });
        return;
      }

      if (isSafari) {
        setPwaStatus({
          installable: false,
          reason: 'Safari on desktop does not support install prompts.',
        });
        return;
      }

      setPwaStatus({
        installable: false,
        reason: 'This browser does not support PWA install prompts.',
      });
    };

    checkPWA();
  }, []);

  useEffect(() => {
    if (!('Notification' in window)) {
      setNotificationStatus({ name: 'Notifications', state: 'Not supported', supported: false });
      return;
    }
    setNotificationStatus({
      name: 'Notifications',
      state: Notification.permission,
      supported: true,
    });
  }, []);

  useEffect(() => {
    if (!('permissions' in navigator) || !navigator.permissions.query) {
      setLocationStatus({ name: 'Location', state: 'Not supported', supported: false });
      return;
    }

    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((res) => {
        setLocationStatus({ name: 'Location', state: res.state, supported: true });
        // eslint-disable-next-line no-param-reassign
        res.onchange = () =>
          setLocationStatus({ name: 'Location', state: res.state, supported: true });
      })
      .catch(() => {
        setLocationStatus({
          name: 'Location',
          state: 'Error checking permission',
          supported: false,
        });
      });
  }, []);

  const cleanState = async (): Promise<void> => {
    logout();

    localStorage.clear();
    sessionStorage.clear();

    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      for (const name of cacheKeys) {
        await caches.delete(name);
      }
    }

    if ('serviceWorker' in navigator) {
      const serviceWorkerRegistrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of serviceWorkerRegistrations) {
        await registration.unregister();
      }
    }

    navigate('/Login');
    window.location.reload();
  };

  return (
    <Content fullwidth padding>
      <AppBar>
        <FormattedMessage {...messages.debug} />
      </AppBar>
      <Main>
        <div className="mb-4">
          <p className="is-size-6-mobile">
            <strong className="mr-2">Snapshot:</strong>
            {snapshotId}
          </p>
        </div>

        <div className="box mb-5">
          <h3 className="title is-6">Service Worker Status</h3>
          {serviceWorkerStatus == null ? (
            <p className="notification is-light">Checking…</p>
          ) : serviceWorkerStatus.available ? (
            serviceWorkerStatus.registrations && serviceWorkerStatus.registrations.length > 0 ? (
              <div>
                {/* Scrollable table on larger screens */}
                <div className="table-container is-hidden-mobile">
                  <table className="table is-fullwidth is-striped is-hoverable">
                    <thead>
                      <tr>
                        <th>Scope</th>
                        <th>Script</th>
                        <th>State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceWorkerStatus.registrations.map((r) => (
                        <tr key={r.scope}>
                          <td className="is-size-6 is-family-monospace">{r.scope}</td>
                          <td className="is-size-6 is-family-monospace">{r.scriptURL}</td>
                          <td>
                            <span
                              className={`tag ${
                                r.state === 'activated'
                                  ? 'is-success'
                                  : r.state === 'waiting'
                                    ? 'is-warning'
                                    : 'is-info'
                              }`}
                            >
                              {r.state}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Card layout on mobile */}
                <div className="is-hidden-tablet">
                  {serviceWorkerStatus.registrations.map((r) => (
                    <div className="card mb-4" key={r.scope}>
                      <div className="card-content">
                        <p className="is-size-6 mb-2">
                          <strong className="mr-2">Scope:</strong>
                          <span className="is-family-monospace">{r.scope}</span>
                        </p>
                        <p className="is-size-6 mb-2">
                          <strong className="mr-2">Script:</strong>
                          <span className="is-family-monospace">{r.scriptURL}</span>
                        </p>
                        <p className="is-size-6">
                          <strong className="mr-2">State:</strong>
                          <span
                            className={`tag ${
                              r.state === 'activated'
                                ? 'is-success'
                                : r.state === 'waiting'
                                  ? 'is-warning'
                                  : 'is-info'
                            }`}
                          >
                            {r.state}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="notification is-warning">{serviceWorkerStatus.reason}</p>
            )
          ) : (
            <p className="notification is-danger">{serviceWorkerStatus.reason}</p>
          )}
        </div>

        <div className="box mb-5">
          <h3 className="title is-6">PWA Installability</h3>
          {pwaStatus == null ? (
            <p className="has-text-grey">Checking…</p>
          ) : pwaStatus.installable ? (
            <p className="has-text-success">This app is installable as a PWA.</p>
          ) : (
            <p className="has-text-danger">{pwaStatus.reason}</p>
          )}
        </div>

        <div className="box mb-5">
          <h3 className="title is-6">Permissions</h3>

          {notificationStatus ? (
            <p className="mb-2">
              <strong className="mr-2">{notificationStatus.name}:</strong>
              {notificationStatus.supported ? (
                <span
                  className={`tag ${
                    notificationStatus.state === 'granted'
                      ? 'is-success'
                      : notificationStatus.state === 'denied'
                        ? 'is-danger'
                        : 'is-warning'
                  }`}
                >
                  {notificationStatus.state}
                </span>
              ) : (
                <span className="tag is-light">Not supported</span>
              )}
            </p>
          ) : (
            <p className="has-text-grey">Checking notifications…</p>
          )}

          {locationStatus ? (
            <p>
              <strong className="mr-2">{locationStatus.name}:</strong>
              {locationStatus.supported ? (
                <span
                  className={`tag ${
                    locationStatus.state === 'granted'
                      ? 'is-success'
                      : locationStatus.state === 'denied'
                        ? 'is-danger'
                        : 'is-warning'
                  }`}
                >
                  {locationStatus.state}
                </span>
              ) : (
                <span className="tag is-light">Not supported</span>
              )}
            </p>
          ) : (
            <p className="has-text-grey">Checking location…</p>
          )}
        </div>

        <div className="has-text-centered">
          <Button onClick={cleanState}>{formatMessage(messages.clean)}</Button>
        </div>
      </Main>
    </Content>
  );
}

import {
  addBreadcrumb,
  browserProfilingIntegration,
  browserTracingIntegration,
  captureMessage,
  type ErrorEvent,
  type EventHint,
  init,
  replayIntegration,
} from '@sentry/browser';
import { AxiosError, isAxiosError } from 'axios';

import pkg from './package.json' with { type: 'json' };

const tracesSampleRate = 0.2;
const profileSampleRate = 0.25;
const replaysSessionSampleRate = 0.02;
const replaysOnErrorSampleRate = 1;

/**
 * Drop requests the browser never managed to send, such as those cancelled by going offline, by
 * closing the tab, or by a content blocker. They carry no response and no server involvement, so
 * they say nothing about the application.
 *
 * @param event The Sentry event about to be sent.
 * @param hint Metadata about the event, including the error that caused it.
 * @returns The event, or `null` to discard it.
 */
export function discardNetworkErrors(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  const error = hint.originalException;
  return isAxiosError(error) && error.code === AxiosError.ERR_NETWORK ? null : event;
}

export function setupSentry(dsn?: string, environment?: string): void {
  if (!dsn) {
    return;
  }

  init({
    dsn,
    environment,
    release: pkg.version,
    integrations: [browserTracingIntegration(), browserProfilingIntegration(), replayIntegration()],
    tracesSampleRate,
    profilesSampleRate: profileSampleRate,
    profileSessionSampleRate: profileSampleRate,
    profileLifecycle: 'trace',
    replaysSessionSampleRate,
    replaysOnErrorSampleRate,
    beforeSend: discardNetworkErrors,
  });

  window.addEventListener('online', () => {
    addBreadcrumb({ category: 'network', message: 'online' });
  });

  window.addEventListener('offline', () => {
    addBreadcrumb({ category: 'network', message: 'offline', level: 'warning' });
  });

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) {
      const bfcacheBlockers: string[] = [];

      // https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEntry/entryType#navigation
      const navigationType =
        (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type ||
        'unknown';

      if (navigationType === 'reload') {
        bfcacheBlockers.push(
          'Page was reloaded, possibly due to no-store headers or JavaScript modifications.',
        );
      }

      captureMessage('Page was not served from bfcache', {
        level: 'warning',
        extra: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          referrer: document.referrer,
          navigationType,
          bfcacheBlockers: bfcacheBlockers.length
            ? bfcacheBlockers
            : ['Unknown reason (check DevTools).'],
        },
      });
    }
  });
}

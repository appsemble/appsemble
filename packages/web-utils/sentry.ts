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
 * A request the browser never completed: cancelled by going offline, by navigating away or closing
 * the tab, or by a content blocker. It carries no response and no server involvement, so it says
 * nothing about the application.
 *
 * @param error The error to inspect.
 * @returns Whether the error is a transient, non-actionable request failure.
 */
function isTransientRequestError(error: unknown): boolean {
  return (
    isAxiosError(error) &&
    (error.code === AxiosError.ERR_NETWORK || error.code === AxiosError.ERR_CANCELED)
  );
}

/**
 * Drop events that do not point at an application fault: transient request failures (see
 * {@link isTransientRequestError}) and dialogs the user closed. Actions rethrow their failure
 * wrapped in an `ActionError`, so the underlying cause is unwrapped as well.
 *
 * @param event The Sentry event about to be sent.
 * @param hint Metadata about the event, including the error that caused it.
 * @returns The event, or `null` to discard it.
 */
export function discardNetworkErrors(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  const error = hint.originalException;
  const cause = (error as { cause?: unknown } | null | undefined)?.cause;
  if (isTransientRequestError(error) || isTransientRequestError(cause)) {
    return null;
  }
  // Closing a dialog rejects its action with no underlying cause; that is a user cancellation, not
  // a fault. The action layer wraps it in an ActionError. Scope this to dialog actions so a
  // non-dialog action that rejects without a value is still reported. (web-utils cannot import
  // ActionError, so match by its name convention.)
  if (
    error instanceof Error &&
    error.name.startsWith('ActionError(dialog') &&
    error.cause == null
  ) {
    return null;
  }
  return event;
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

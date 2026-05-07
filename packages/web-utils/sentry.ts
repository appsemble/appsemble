import {
  addBreadcrumb,
  type Breadcrumb,
  browserProfilingIntegration,
  browserTracingIntegration,
  captureMessage,
  type ErrorEvent,
  init,
  replayIntegration,
} from '@sentry/browser';

import pkg from './package.json' with { type: 'json' };

const tracesSampleRate = 0.2;
const profileSampleRate = 0.25;
const replaysSessionSampleRate = 0.02;
const replaysOnErrorSampleRate = 1;
const sensitivePropertyPattern = /authorization|cookie|credential|password|secret|session|token/i;
const maxSentryContextDepth = 4;
const maxSentryContextProperties = 25;
const maxSentryContextStringLength = 500;

function scrubSentryValue(value: unknown, depth = 0): unknown {
  if (value == null || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return value.length > maxSentryContextStringLength
      ? `${value.slice(0, maxSentryContextStringLength)}...`
      : value;
  }
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return `[${value.constructor.name}]`;
  }
  if (depth >= maxSentryContextDepth) {
    return '[MaxDepth]';
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, maxSentryContextProperties)
      .map((entry) => scrubSentryValue(entry, depth + 1));
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, maxSentryContextProperties)
        .map(([key, entry]) => [
          key,
          sensitivePropertyPattern.test(key) ? '[Filtered]' : scrubSentryValue(entry, depth + 1),
        ]),
    );
  }
  return `[${typeof value}]`;
}

function scrubSentryBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  return {
    ...breadcrumb,
    data: scrubSentryValue(breadcrumb.data) as Breadcrumb['data'],
  };
}

function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  return {
    ...event,
    breadcrumbs: event.breadcrumbs?.map(scrubSentryBreadcrumb),
    contexts: scrubSentryValue(event.contexts) as ErrorEvent['contexts'],
    extra: scrubSentryValue(event.extra) as ErrorEvent['extra'],
    request: scrubSentryValue(event.request) as ErrorEvent['request'],
    tags: scrubSentryValue(event.tags) as ErrorEvent['tags'],
    user: scrubSentryValue(event.user) as ErrorEvent['user'],
  };
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
    beforeBreadcrumb: scrubSentryBreadcrumb,
    beforeSend: scrubSentryEvent,
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

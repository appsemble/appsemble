import { addBreadcrumb, captureMessage, init } from '@sentry/browser';

import pkg from './package.json' with { type: 'json' };

export function setupSentry(dsn: string, environment: string): void {
  init({ dsn, environment, release: pkg.version });

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

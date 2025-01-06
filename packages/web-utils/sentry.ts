import { addBreadcrumb, init } from '@sentry/browser';

import pkg from './package.json' with { type: 'json' };

export function setupSentry(dsn: string, environment: string): void {
  init({ dsn, environment, release: pkg.version });

  window.addEventListener('online', () => {
    addBreadcrumb({ category: 'network', message: 'online' });
  });

  window.addEventListener('offline', () => {
    addBreadcrumb({ category: 'network', message: 'offline', level: 'warning' });
  });
}

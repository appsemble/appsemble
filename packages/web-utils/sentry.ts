import { addBreadcrumb, init } from '@sentry/browser';

export function setupSentry(dsn: string, environment: string): void {
  init({ dsn, environment, release: process.env.APPSEMBLE_VERSION });

  window.addEventListener('online', () => {
    addBreadcrumb({ category: 'network', message: 'online' });
  });

  window.addEventListener('offline', () => {
    addBreadcrumb({ category: 'network', message: 'offline', level: 'warning' });
  });
}

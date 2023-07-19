import { type ContentSecurityPolicy, type GetCspParams } from '@appsemble/node-utils';

import { getSentryClientSettings } from '../utils/sentry.js';

export function getCsp({
  app,
  host,
  hostname,
  nonce,
  settingsHash,
}: GetCspParams): ContentSecurityPolicy {
  const { reportUri, sentryDsn, sentryOrigin } = getSentryClientSettings(
    hostname,
    app.sentryDsn,
    app.sentryEnvironment,
  );

  return {
    'report-uri': [reportUri],
    'connect-src': ['*', 'blob:', 'data:', sentryOrigin, sentryDsn && 'https://sentry.io'],
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      settingsHash,
      app.googleAnalyticsID && 'https://www.googletagmanager.com',
      // This is needed for Webpack.
      process.env.NODE_ENV !== 'production' && "'unsafe-eval'",
    ],
    'img-src': ['*', 'blob:', 'data:', host],
    'media-src': ['*', 'blob:', 'data:', host],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ['*', 'data:'],
    'frame-src': ["'self'", '*.vimeo.com', '*.youtube.com'],
  };
}

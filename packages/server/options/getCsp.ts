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
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    'report-uri': [reportUri],
    'connect-src': ['*', 'blob:', 'data:', sentryOrigin, sentryDsn && 'https://sentry.io'],
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      settingsHash,
      app.googleAnalyticsID ? 'https://www.googletagmanager.com' : false,
      // This is needed for Webpack.
      process.env.NODE_ENV !== 'production' && "'unsafe-eval'",
    ],
    'img-src': ['*', 'blob:', 'data:', host],
    'media-src': ['*', 'blob:', 'data:', host],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ['*', 'data:'],
    'frame-src': ["'self'", 'blob:', '*.vimeo.com', '*.youtube.com', '*.weseedo.nl', host],
    'object-src': ['*', 'data:', 'blob:', host],
  };
}

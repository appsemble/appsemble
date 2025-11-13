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
    'connect-src': [
      '*',
      'blob:',
      'data:',
      sentryOrigin ?? false,
      sentryDsn ? 'https://sentry.io' : false,
      app.metaPixelID ? 'https://graph.facebook.com' : false,
      app.msClarityID ? 'https://www.clarity.ms' : false,
      app.msClarityID ? 'https://clarity.ms' : false,
    ],
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      settingsHash,
      app.googleAnalyticsID ? 'https://www.googletagmanager.com' : false,
      app.metaPixelID ? 'https://connect.facebook.net' : false,
      app.msClarityID ? 'https://www.clarity.ms' : false,
      app.msClarityID ? 'https://clarity.ms' : false,
      // This is needed for Webpack.
      process.env.NODE_ENV !== 'production' && "'unsafe-eval'",
    ],
    'img-src': [
      '*',
      'blob:',
      'data:',
      host,
      app.metaPixelID ? 'https://www.facebook.com' : false,
      app.msClarityID ? 'https://www.clarity.ms' : false,
      app.msClarityID ? 'https://clarity.ms' : false,
    ],
    'media-src': ['*', 'blob:', 'data:', host],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ['*', 'data:'],
    'frame-src': ["'self'", 'blob:', '*.vimeo.com', '*.youtube.com', '*.weseedo.nl', host],
    'object-src': ['*', 'data:', 'blob:', host],
  };
}

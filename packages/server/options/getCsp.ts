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

  const requiresDynamicScripts = Boolean(app.msClarityID) || Boolean(app.metaPixelID);

  const scriptSrc: (string | false)[] = requiresDynamicScripts
    ? [
        "'self'",
        "'unsafe-inline'",
        app.googleAnalyticsID ? 'https://www.googletagmanager.com' : false,
        app.metaPixelID ? 'https://connect.facebook.net' : false,
        app.msClarityID ? 'https://www.clarity.ms' : false,
        app.msClarityID ? 'https://clarity.ms' : false,
        app.msClarityID ? 'https://scripts.clarity.ms' : false,
        process.env.NODE_ENV !== 'production' && "'unsafe-eval'",
      ]
    : [
        "'self'",
        `'nonce-${nonce}'`,
        settingsHash,
        app.googleAnalyticsID ? 'https://www.googletagmanager.com' : false,
        process.env.NODE_ENV !== 'production' && "'unsafe-eval'",
      ];

  return {
    'report-uri': [reportUri ?? false],
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
    'script-src': scriptSrc,
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
    // Unsafe-inline used in the restaurants app.
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ['*', 'data:'],
    // Frames videos from vimeo and youtube in the `@appsemble/video` block, weseedo in
    // `@eindhoven/weseedo` block.
    'frame-src': ["'self'", 'blob:', '*.vimeo.com', '*.youtube.com', '*.weseedo.nl', host],
    'object-src': ['*', 'data:', 'blob:', host],
    // Framed in the appsemble studio for a preview, hence `host` in frame-ancestors
    'frame-ancestors': [host],
    'base-uri': ["'self'"],
  };
}

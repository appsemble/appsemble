import { baseTheme } from '@appsemble/lang-sdk';
import { type ContentSecurityPolicy, type GetCspParams } from '@appsemble/node-utils';

import { getSentryClientSettings } from '../utils/sentry.js';

function getCustomDirectiveSources(app: GetCspParams['app'], directive: string): string[] {
  return app.definition.contentSecurityPolicy?.[directive] ?? [];
}

export function getCsp({
  app,
  host,
  hostname,
  nonce,
  settingsHash,
}: GetCspParams): ContentSecurityPolicy {
  const { reportUri, sentryOrigin } = getSentryClientSettings(
    hostname,
    app.sentryDsn,
    app.sentryEnvironment,
  );

  const hasStrictContentSecurityPolicy = Boolean(app.definition.contentSecurityPolicy);
  const fontSource = app.definition.theme?.font?.source ?? baseTheme.font.source;
  const objectSrc = getCustomDirectiveSources(app, 'object-src');
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
        ...getCustomDirectiveSources(app, 'script-src'),
        process.env.NODE_ENV !== 'production' && "'unsafe-eval'",
      ]
    : [
        "'self'",
        `'nonce-${nonce}'`,
        settingsHash,
        app.googleAnalyticsID ? 'https://www.googletagmanager.com' : false,
        ...getCustomDirectiveSources(app, 'script-src'),
        process.env.NODE_ENV !== 'production' && "'unsafe-eval'",
      ];

  return {
    'report-uri': [reportUri ?? false],
    'connect-src': hasStrictContentSecurityPolicy
      ? [
          "'self'",
          'blob:',
          'data:',
          host,
          sentryOrigin ?? false,
          app.metaPixelID ? 'https://graph.facebook.com' : false,
          app.msClarityID ? 'https://www.clarity.ms' : false,
          app.msClarityID ? 'https://clarity.ms' : false,
          ...getCustomDirectiveSources(app, 'connect-src'),
        ]
      : [
          '*',
          'blob:',
          'data:',
          sentryOrigin ?? false,
          app.metaPixelID ? 'https://graph.facebook.com' : false,
          app.msClarityID ? 'https://www.clarity.ms' : false,
          app.msClarityID ? 'https://clarity.ms' : false,
        ],
    'default-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'script-src': scriptSrc,
    'img-src': hasStrictContentSecurityPolicy
      ? [
          "'self'",
          'blob:',
          'data:',
          host,
          app.metaPixelID ? 'https://www.facebook.com' : false,
          app.msClarityID ? 'https://www.clarity.ms' : false,
          app.msClarityID ? 'https://clarity.ms' : false,
          ...getCustomDirectiveSources(app, 'img-src'),
        ]
      : [
          '*',
          'blob:',
          'data:',
          host,
          app.metaPixelID ? 'https://www.facebook.com' : false,
          app.msClarityID ? 'https://www.clarity.ms' : false,
          app.msClarityID ? 'https://clarity.ms' : false,
        ],
    'media-src': hasStrictContentSecurityPolicy
      ? ["'self'", 'blob:', 'data:', host, ...getCustomDirectiveSources(app, 'media-src')]
      : ['*', 'blob:', 'data:', host],
    // Unsafe-inline used in the restaurants app.
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      fontSource === 'google' ? 'https://fonts.googleapis.com' : false,
      ...getCustomDirectiveSources(app, 'style-src'),
    ],
    'font-src': hasStrictContentSecurityPolicy
      ? [
          "'self'",
          'data:',
          fontSource === 'google' ? 'https://fonts.gstatic.com' : false,
          ...getCustomDirectiveSources(app, 'font-src'),
        ]
      : ['*', 'data:'],
    // Frames videos from vimeo and youtube in the `@appsemble/video` block, weseedo in
    // `@eindhoven/weseedo` block.
    'frame-src': [
      "'self'",
      'blob:',
      '*.vimeo.com',
      '*.youtube.com',
      '*.weseedo.nl',
      host,
      ...getCustomDirectiveSources(app, 'frame-src'),
    ],
    'object-src': hasStrictContentSecurityPolicy
      ? objectSrc.length
        ? objectSrc
        : ["'none'"]
      : ['*', 'data:', 'blob:', host],
    // Framed in the appsemble studio for a preview, hence `host` in frame-ancestors
    'frame-ancestors': [host],
    'base-uri': ["'self'"],
  };
}

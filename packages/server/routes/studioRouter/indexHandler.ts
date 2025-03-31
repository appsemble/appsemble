// eslint-disable-next-line unicorn/import-style
import crypto from 'node:crypto';

import { createSettings, makeCSP, render } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { argv } from '../../utils/argv.js';
import { fetchCustomAppDomains } from '../../utils/fetchCustomDomains.js';
import { githubPreset, gitlabPreset, googlePreset } from '../../utils/OAuth2Presets.js';
import { getSentryClientSettings } from '../../utils/sentry.js';

/**
 * Serve `index.html` for editor related routes.
 *
 * @param ctx The Koa context.
 * @returns void
 */
export async function indexHandler(ctx: Context): Promise<void> {
  const {
    hostname,
    state: { appCollectionId },
  } = ctx;
  const { disableRegistration, githubClientId, gitlabClientId, googleClientId, host } = argv;
  const logins = [];
  const domains = await fetchCustomAppDomains();
  ctx.set('x-content-type-options', 'nosniff');
  ctx.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (githubClientId) {
    logins.push({
      authorizationUrl: githubPreset.authorizationUrl,
      clientId: githubClientId,
      icon: githubPreset.icon,
      name: githubPreset.name,
      scope: githubPreset.scope,
    });
  }
  if (gitlabClientId) {
    logins.push({
      authorizationUrl: gitlabPreset.authorizationUrl,
      clientId: gitlabClientId,
      icon: gitlabPreset.icon,
      name: gitlabPreset.name,
      scope: gitlabPreset.scope,
    });
  }
  if (googleClientId) {
    logins.push({
      authorizationUrl: googlePreset.authorizationUrl,
      clientId: googleClientId,
      icon: googlePreset.icon,
      name: googlePreset.name,
      scope: googlePreset.scope,
    });
  }
  const nonce = crypto.randomBytes(16).toString('base64');
  const { reportUri, sentryDsn, sentryEnvironment, sentryOrigin } =
    getSentryClientSettings(hostname);
  const [settingsHash, settings] = createSettings({
    enableRegistration: !disableRegistration,
    logins,
    sentryDsn,
    sentryEnvironment,
    customDomainAppCollection: appCollectionId ? { id: appCollectionId, realHost: host } : null,
  });
  const csp = makeCSP({
    'report-uri': [reportUri ?? false],
    // This is needed for Webpack.
    'connect-src':
      process.env.NODE_ENV === 'production'
        ? [sentryDsn ? 'https://sentry.io' : false, sentryOrigin ?? false, "'self'", '127.0.0.1:*']
        : ['*'],
    'default-src': ["'self'", sentryOrigin ?? false],
    'img-src': ['blob:', 'data:', '*'],
    'script-src': [
      "'self'",
      settingsHash,
      `'nonce-${nonce}'`,
      // This is needed for Webpack.
      process.env.NODE_ENV !== 'production' && "'unsafe-eval'",
    ],
    'style-src': [
      "'self'",
      // Monaco requires this for syntax highlighting
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
    ],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'frame-src': [`*.${new URL(host).host}`, host, ...domains],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
  });
  ctx.set('Content-Security-Policy', csp);
  return render(ctx, 'studio/index.html', { nonce, settings });
}

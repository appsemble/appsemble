import { randomBytes } from 'crypto';

import { Context } from 'koa';

import { argv } from '../../utils/argv';
import { githubPreset, gitlabPreset, googlePreset } from '../../utils/OAuth2Presets';
import { createSettings, makeCSP, render } from '../../utils/render';
import { getSentryClientSettings } from '../../utils/sentry';

/**
 * Serve `index.html` for editor related routes.
 *
 * @param ctx The Koa context.
 * @returns void
 */
export function indexHandler(ctx: Context): Promise<void> {
  const { hostname } = ctx;
  const { disableRegistration, githubClientId, gitlabClientId, googleClientId, host } = argv;
  const logins = [];
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
  const nonce = randomBytes(16).toString('base64');
  const { reportUri, sentryDsn, sentryEnvironment, sentryOrigin } =
    getSentryClientSettings(hostname);
  const [settingsHash, settings] = createSettings({
    enableRegistration: !disableRegistration,
    logins,
    sentryDsn,
    sentryEnvironment,
  });
  const csp = makeCSP({
    'report-uri': [reportUri],
    // This is needed for Webpack.
    'connect-src':
      process.env.NODE_ENV === 'production'
        ? [sentryDsn && 'https://sentry.io', sentryOrigin, "'self'", '127.0.0.1']
        : ['*'],
    'default-src': ["'self'", sentryOrigin],
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
    'frame-src': [`*.${new URL(host).host}`, host],
  });
  ctx.set('Content-Security-Policy', csp);
  return render(ctx, 'studio/index.html', { nonce, settings });
}

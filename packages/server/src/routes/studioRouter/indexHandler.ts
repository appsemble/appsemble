import { randomBytes } from 'crypto';
import { URL } from 'url';

import { KoaContext } from '../../types';
import { githubPreset, gitlabPreset, googlePreset } from '../../utils/OAuth2Presets';
import { createSettings, makeCSP } from '../../utils/render';
import { sentryDsnToReportUri } from '../../utils/sentryDsnToReportUri';

/**
 * Serve `index.html` for editor related routes.
 *
 * @param ctx - The Koa context.
 */
export async function indexHandler(ctx: KoaContext): Promise<void> {
  const {
    state: { render },
  } = ctx;
  const {
    disableRegistration,
    githubClientId,
    gitlabClientId,
    googleClientId,
    host,
    sentryDsn,
    sentryEnvironment,
  } = argv;
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
  const sentry = sentryDsnToReportUri(sentryDsn);
  const [settingsHash, settings] = createSettings({
    enableRegistration: !disableRegistration,
    logins,
    sentryDsn,
    sentryEnvironment,
  });
  const csp = makeCSP({
    'report-uri': [sentry?.reportUri],
    // This is needed for Webpack.
    'connect-src':
      process.env.NODE_ENV === 'production'
        ? [sentryDsn && 'https://sentry.io', sentryDsn && new URL(sentryDsn).origin, "'self'"]
        : ['*'],
    'default-src': ["'self'", sentry?.origin],
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
  ctx.body = await render('studio.html', { nonce, settings });
  ctx.type = 'text/html';
}

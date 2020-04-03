import crypto from 'crypto';

import createSettings from '../../utils/createSettings';
import makeCSP from '../../utils/makeCSP';
import sentryDsnToReportUri from '../../utils/sentryDsnToReportUri';

/**
 * Serve `index.html` for editor related routes.
 */
export default async function indexHandler(ctx) {
  const { render } = ctx.state;
  const { argv } = ctx;
  const { disableRegistration, host, sentryDsn } = argv;
  const logins = [];
  if (argv.oauthGitlabKey) {
    logins.push('gitlab');
  }
  if (argv.oauthGoogleKey) {
    logins.push('google');
  }
  const nonce = crypto.randomBytes(16).toString('base64');
  const reportUri = sentryDsnToReportUri(sentryDsn);
  const [settingsHash, settings] = createSettings({
    enableRegistration: !disableRegistration,
    logins,
    sentryDsn,
  });
  const csp = makeCSP({
    'report-uri': [reportUri],
    // This is needed for Webpack.
    'connect-src': [process.env.NODE_ENV !== 'production' && '*'],
    'default-src': ["'self'"],
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

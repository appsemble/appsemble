import qs from 'querystring';

import createSettings from '../../utils/createSettings';
import makeCSP from '../../utils/makeCSP';
import sentryDsnToReportUri from '../../utils/sentryDsnToReportUri';
import { bulmaURL, faURL } from '../../utils/styleURL';

/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 */
export default async function indexHandler(ctx) {
  ctx.type = 'text/html';
  const { app, base, render } = ctx.state;
  const { sentryDsn } = ctx.argv;
  const reportUri = sentryDsnToReportUri(sentryDsn);
  const csp = {
    'report-uri': [reportUri],
    'connect-src': ['*', 'blob:', 'data:'],
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // This is needed for Webpack.
      process.env.NODE_ENV !== 'production' && "'unsafe-eval'",
    ],
    'img-src': ['*', 'blob:', 'data:'],
    'media-src': ['*', 'blob:', 'data:'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'frame-src': ["'self'", '*.vimeo.com', '*.youtube.com'],
  };

  if (app == null) {
    ctx.body = await render('error.html', {
      bulmaURL,
      faURL,
      message: 'The app you are looking for could not be found.',
    });
    ctx.status = 404;
  } else {
    const [settingsHash, settings] = createSettings({
      id: app.id,
      vapidPublicKey: app.vapidPublicKey,
      organizationId: app.OrganizationId,
      definition: app.definition,
      sentryDsn,
    });
    csp['script-src'].push(settingsHash);
    ctx.body = await render('app.html', {
      app,
      base,
      bulmaURL: `${bulmaURL}?${qs.stringify(app.definition.theme)}`,
      faURL,
      settings,
    });
  }
  ctx.set('Content-Security-Policy', makeCSP(csp));
}

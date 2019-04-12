import qs from 'querystring';

import { bulmaURL, faURL } from '../../utils/styleURL';
import makeCSP from '../../utils/makeCSP';
import sentryDsnToReportUri from '../../utils/sentryDsnToReportUri';

/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 */
export default async function indexHandler(ctx) {
  const { path } = ctx.params;
  const { App } = ctx.db.models;
  ctx.type = 'text/html';
  const { render } = ctx.state;
  const { sentryDsn } = ctx.argv;
  const reportUri = sentryDsnToReportUri(sentryDsn);
  const csp = makeCSP({
    'report-uri': [reportUri],
    'connect-src': ['*'],
    'default-src': [
      "'self'",
      // This is needed for Webpack.
      process.env.NODE_ENV !== 'production' && "'unsafe-eval'",
    ],
    'img-src': ['*', 'blob:', 'data:'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  });
  ctx.set('Content-Security-Policy', csp);

  try {
    const app = await App.findOne({ where: { path } }, { raw: true });

    if (app == null) {
      ctx.body = await render('error.html', {
        bulmaURL,
        faURL,
        message: 'The app you are looking for could not be found.',
      });
      ctx.status = 404;
    } else {
      ctx.body = await render('app.html', {
        app,
        bulmaURL: `${bulmaURL}?${qs.stringify(app.definition.theme)}`,
        faURL,
        sentryDsn,
      });
    }
  } catch (error) {
    ctx.body = await render('error.html', {
      bulmaURL,
      faURL,
      message: 'There was a problem loading the app. Please try again later.',
    });
    ctx.status = 500;
  }
}

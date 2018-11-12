import path from 'path';

import pug from 'pug';

import bulmaURL from '../../utils/bulmaURL';
import makeCSP from '../../utils/makeCSP';
import sentryDsnToReportUri from '../../utils/sentryDsnToReportUri';

const render = pug.compileFile(path.join(__dirname, 'index.pug'));
const renderError = pug.compileFile(path.join(__dirname, 'error.pug'));

/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 */
export default async function indexHandler(ctx) {
  const { path: p } = ctx.params;
  const { App } = ctx.db.models;
  ctx.type = 'text/html';
  const assets = await ctx.state.getAssets().app;
  const { sentryDsn } = ctx.state;
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
    'style-src': ["'self'", "'unsafe-inline'"],
  });
  ctx.set('Content-Security-Policy', csp);

  try {
    const app = await App.findOne({ where: { path: p } });
    if (app == null) {
      ctx.body = renderError({
        assets,
        bulmaURL,
        message: 'The app you are looking for could not be found.',
      });
      ctx.status = 404;
    } else {
      ctx.body = render({
        app,
        assets,
        bulmaURL,
        sentryDsn,
      });
    }
  } catch (error) {
    ctx.body = renderError({
      assets,
      bulmaURL,
      message: 'There was a problem loading the app. Please try again later.',
    });
    ctx.status = 500;
  }
}

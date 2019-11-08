import makeCSP from '../../utils/makeCSP';
import sentryDsnToReportUri from '../../utils/sentryDsnToReportUri';

/**
 * Serve `index.html` for studio related routes.
 */
export default async function indexHandler(ctx) {
  const { render } = ctx.state;
  const { argv, hostname } = ctx;
  const { host, sentryDsn } = argv;
  const reportUri = sentryDsnToReportUri(sentryDsn);
  const csp = makeCSP({
    'report-uri': [reportUri],
    // This is needed for Webpack.
    'connect-src': [process.env.NODE_ENV !== 'production' && '*'],
    'default-src': ["'self'"],
    'img-src': ["'self'", host],
    'script-src': [
      "'self'",
      // This is needed for Webpack.
      process.env.NODE_ENV !== 'production' && "'unsafe-eval'",
    ],
    'style-src': ["'self'", 'https://fonts.googleapis.com', host],
    'font-src': ["'self'", 'https://fonts.gstatic.com', host],
  });
  ctx.set('Content-Security-Policy', csp);
  ctx.body = await render('fallback.html', { host, hostname });
  ctx.status = 404;
  ctx.type = 'text/html';
}

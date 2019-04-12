import makeCSP from '../../utils/makeCSP';
import sentryDsnToReportUri from '../../utils/sentryDsnToReportUri';

/**
 * Serve `index.html` for editor related routes.
 */
export default async function editorHandler(ctx) {
  const { render } = ctx.state;
  const { sentryDsn } = ctx.argv;
  const reportUri = sentryDsnToReportUri(sentryDsn);
  const csp = makeCSP({
    'report-uri': [reportUri],
    // This is needed for Webpack.
    'connect-src': [(process.env.NODE_ENV = process.env.NODE_ENV !== 'production' && '*')],
    'default-src': [
      "'self'",
      // This is needed for Webpack.
      process.env.NODE_ENV !== 'production' && "'unsafe-eval'",
    ],
    'img-src': ["'self'", 'blob:', 'data:'],
    'style-src': [
      "'self'",
      // Monaco requires this for syntax highlighting
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
    ],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
  });
  ctx.set('Content-Security-Policy', csp);
  ctx.body = await render('index.html', { sentryDsn });
  ctx.type = 'text/html';
}

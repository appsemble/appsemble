import Koa from 'koa';
import request from 'supertest';

import createServer from '../../utils/createServer';

let app;
let templateName;
let templateData;

beforeEach(() => {
  app = new Koa();
  app.use(async (ctx, next) => {
    ctx.state.render = async (template, data) => {
      templateName = template;
      templateData = data;
      return '<!doctype html>';
    };
    return next();
  });
});

it('should serve the editor index page with correct headers', async () => {
  const server = await createServer({ app, db: { models: {} } });
  const response = await request(server).get('/');
  expect(response.type).toBe('text/html');
  expect(response.text).toBe('<!doctype html>');
  expect(response.headers['content-security-policy']).toBe(
    'connect-src *' +
      "; default-src 'self'" +
      "; font-src 'self' https://fonts.gstatic.com" +
      "; img-src 'self' blob: data: https://www.gravatar.com" +
      "; script-src 'self' 'sha256-9sOokSPGKu0Vo4/TBZI1T7Bm5ThrXz9qTWATwd3augo=' 'unsafe-eval'" +
      "; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  );
  expect(templateName).toBe('editor.html');
  expect(templateData).toStrictEqual({
    settings: '<script>window.settings={"enableRegistration":true,"logins":[]}</script>',
  });
});

it('should pass login options from argv to the editor', async () => {
  const server = await createServer({
    app,
    argv: {
      disableRegistration: true,
      host: 'http://localhost:9999',
      oauthGitlabKey: 'GitLab secret',
      oauthGoogleKey: 'Google secret',
      sentryDsn: 'https://secret@sentry.io/path',
    },
    db: { models: {} },
  });
  const response = await request(server).get('/');
  expect(response.type).toBe('text/html');
  expect(response.text).toBe('<!doctype html>');
  expect(response.headers['content-security-policy']).toBe(
    'connect-src *' +
      "; default-src 'self'" +
      "; font-src 'self' https://fonts.gstatic.com" +
      "; img-src 'self' blob: data: https://www.gravatar.com" +
      '; report-uri https://sentry.io/api/path/security/?sentry_key=secret' +
      "; script-src 'self' 'sha256-u7Lwg39nDVoG/C+KUi2A+femGRBoDntSTyJiVRgbfqc=' 'unsafe-eval'" +
      "; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  );
  expect(templateName).toBe('editor.html');
  expect(templateData).toStrictEqual({
    settings:
      '<script>' +
      'window.settings={' +
      '"enableRegistration":false,' +
      '"logins":["gitlab","google"],' +
      '"sentryDsn":"https://secret@sentry.io/path"' +
      '}' +
      '</script>',
  });
});

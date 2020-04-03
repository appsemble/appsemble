import { createInstance } from 'axios-test-instance';
import Koa from 'koa';

import studioRouter from '.';

let app;
let request;
let templateName;
let templateData;

jest.mock('crypto');

beforeAll(async () => {
  app = new Koa();
  app.context.argv = { host: 'https://app.example:9999' };
  app.use(async (ctx, next) => {
    ctx.state.render = async (template, data) => {
      templateName = template;
      templateData = data;
      return '<!doctype html>';
    };
    return next();
  });
  app.use(studioRouter);
  request = await createInstance(app);
});

afterAll(async () => {
  await request.close();
});

it('should serve the studio index page with correct headers', async () => {
  app.context.argv = {
    host: 'http://localhost:9999',
  };
  const response = await request.get('/');
  expect(response).toMatchObject({
    headers: expect.objectContaining({
      'content-security-policy':
        'connect-src *' +
        "; default-src 'self'" +
        "; font-src 'self' https://fonts.gstatic.com" +
        '; frame-src *.localhost:9999 http://localhost:9999' +
        '; img-src * blob: data:' +
        "; script-src 'nonce-AAAAAAAAAAAAAAAAAAAAAA==' 'self' 'sha256-9sOokSPGKu0Vo4/TBZI1T7Bm5ThrXz9qTWATwd3augo=' 'unsafe-eval'" +
        "; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      'content-type': 'text/html; charset=utf-8',
    }),
    data: '<!doctype html>',
  });
  expect(templateName).toBe('studio.html');
  expect(templateData).toStrictEqual({
    nonce: 'AAAAAAAAAAAAAAAAAAAAAA==',
    settings: '<script>window.settings={"enableRegistration":true,"logins":[]}</script>',
  });
});

it('should pass login options from argv to the studio', async () => {
  app.context.argv = {
    disableRegistration: true,
    host: 'http://localhost:9999',
    oauthGitlabKey: 'GitLab secret',
    oauthGoogleKey: 'Google secret',
    sentryDsn: 'https://secret@sentry.io/path',
  };
  const response = await request.get('/');
  expect(response).toMatchObject({
    headers: expect.objectContaining({
      'content-security-policy':
        'connect-src *' +
        "; default-src 'self'" +
        "; font-src 'self' https://fonts.gstatic.com" +
        '; frame-src *.localhost:9999 http://localhost:9999' +
        '; img-src * blob: data:' +
        '; report-uri https://sentry.io/api/path/security/?sentry_key=secret' +
        "; script-src 'nonce-AAAAAAAAAAAAAAAAAAAAAA==' 'self' 'sha256-u7Lwg39nDVoG/C+KUi2A+femGRBoDntSTyJiVRgbfqc=' 'unsafe-eval'" +
        "; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      'content-type': 'text/html; charset=utf-8',
    }),
    data: '<!doctype html>',
  });
  expect(templateName).toBe('studio.html');
  expect(templateData).toStrictEqual({
    nonce: 'AAAAAAAAAAAAAAAAAAAAAA==',
    settings:
      '<script>window.settings={"enableRegistration":false,"logins":["gitlab","google"],"sentryDsn":"https://secret@sentry.io/path"}</script>',
  });
});

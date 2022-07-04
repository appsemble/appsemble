import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';

import { studioRouter } from '.';
import { setArgv } from '../../utils/argv';
import * as render from '../../utils/render';

let templateName: string;
let templateData: Record<string, unknown>;

jest.mock('crypto');

beforeAll(async () => {
  setArgv({ host: 'https://app.example:9999' });
  const app = new Koa();
  app.use(studioRouter);
  await setTestApp(app);
});

beforeEach(() => {
  // eslint-disable-next-line require-await
  jest.spyOn(render, 'render').mockImplementation(async (ctx, template, data) => {
    templateName = template;
    templateData = data;
    ctx.body = '<!doctype html>';
    ctx.type = 'html';
  });
});

it('should serve the studio index page with correct headers', async () => {
  setArgv({
    host: 'http://localhost:9999',
  });
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
  expect(templateName).toBe('studio/index.html');
  expect(templateData).toStrictEqual({
    nonce: 'AAAAAAAAAAAAAAAAAAAAAA==',
    settings: '<script>window.settings={"enableRegistration":true,"logins":[]}</script>',
  });
});

it('should pass login options from argv to the studio', async () => {
  setArgv({
    disableRegistration: true,
    host: 'http://localhost:9999',
    gitlabClientId: 'GitLab secret',
    googleClientId: 'Google secret',
    sentryDsn: 'https://secret@sentry.io/path',
    sentryAllowedDomains: '*',
  });
  const response = await request.get('/');
  expect(response).toMatchObject({
    headers: expect.objectContaining({
      'content-security-policy':
        'connect-src *' +
        "; default-src 'self' https://sentry.io" +
        "; font-src 'self' https://fonts.gstatic.com" +
        '; frame-src *.localhost:9999 http://localhost:9999' +
        '; img-src * blob: data:' +
        '; report-uri https://sentry.io/api/path/security/?sentry_key=secret' +
        "; script-src 'nonce-AAAAAAAAAAAAAAAAAAAAAA==' 'self' 'sha256-55BH1zlzYBdLKuc8rxGYlA+gttOW/TiZC2YsrbcbG8Q=' 'unsafe-eval'" +
        "; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      'content-type': 'text/html; charset=utf-8',
    }),
    data: '<!doctype html>',
  });
  expect(templateName).toBe('studio/index.html');
  expect(templateData).toStrictEqual({
    nonce: 'AAAAAAAAAAAAAAAAAAAAAA==',
    settings: `<script>window.settings=${JSON.stringify({
      enableRegistration: false,
      logins: [
        {
          authorizationUrl: 'https://gitlab.com/oauth/authorize',
          clientId: 'GitLab secret',
          icon: 'gitlab',
          name: 'GitLab',
          scope: 'email openid profile',
        },
        {
          authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
          clientId: 'Google secret',
          icon: 'google',
          name: 'Google',
          scope: 'email openid profile',
        },
      ],
      sentryDsn: 'https://secret@sentry.io/path',
    })}</script>`,
  });
});

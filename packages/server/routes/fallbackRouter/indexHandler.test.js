import Koa from 'koa';
import request from 'supertest';

import fallbackRouter from '.';

let app;
let templateName;
let templateData;

beforeEach(() => {
  app = new Koa();
  app.context.argv = {
    host: 'https://example.com:1337',
  };
  app.use(async (ctx, next) => {
    ctx.state.render = async (template, data) => {
      templateName = template;
      templateData = data;
      return '<!doctype html>';
    };
    return next();
  });
  app.use(fallbackRouter);
});

it('should serve the fallback index page with correct headers', async () => {
  const response = await request(app.callback()).get('/');
  expect(response.type).toBe('text/html');
  expect(response.text).toBe('<!doctype html>');
  expect(response.status).toBe(404);
  expect(response.headers['content-security-policy']).toBe(
    'connect-src *' +
      "; default-src 'self'" +
      "; font-src 'self' https://example.com:1337 https://fonts.gstatic.com" +
      "; img-src 'self' https://example.com:1337" +
      "; script-src 'self' 'unsafe-eval'" +
      "; style-src 'self' https://example.com:1337 https://fonts.googleapis.com",
  );
  expect(templateName).toBe('fallback.html');
  expect(templateData).toStrictEqual({
    host: 'https://example.com:1337',
    hostname: '127.0.0.1',
  });
});

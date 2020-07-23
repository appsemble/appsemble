import type { EmailActionDefinition } from '@appsemble/types';
import { AxiosTestInstance, createInstance, request, setTestApp } from 'axios-test-instance';
import Koa, { ParameterizedContext } from 'koa';
import type { Transporter } from 'nodemailer';
import { URL } from 'url';

import { App, Organization } from '../models';
import createServer from '../utils/createServer';
import readPackageJson from '../utils/readPackageJson';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

const { version } = readPackageJson();

let proxiedApp: Koa;
let proxiedContext: ParameterizedContext;
let proxiedRequest: AxiosTestInstance;

beforeAll(createTestSchema('apps'));

beforeAll(async () => {
  const server = await createServer({ argv: { host: 'http://localhost', secret: 'test' } });
  await setTestApp(server);
});

beforeEach(async () => {
  proxiedApp = new Koa().use(async (ctx) => {
    ctx.body = { message: 'I’m a teapot' };
    ctx.status = 418;
    proxiedContext = ctx;
  });
  proxiedRequest = await createInstance(proxiedApp);
  const { baseURL } = proxiedRequest.defaults;
  await Organization.create({ id: 'org' });
  await App.create({
    vapidPublicKey: '',
    vapidPrivateKey: '',
    OrganizationId: 'org',
    definition: {
      defaultPage: '',
      pages: [
        {
          name: '',
          blocks: [
            {
              type: '',
              version: '',
              actions: {
                get: {
                  type: 'request',
                  url: baseURL,
                },
                delete: {
                  type: 'request',
                  method: 'delete',
                  url: baseURL,
                },
                patch: {
                  type: 'request',
                  method: 'patch',
                  url: baseURL,
                },
                post: {
                  type: 'request',
                  method: 'post',
                  url: baseURL,
                },
                put: {
                  type: 'request',
                  method: 'put',
                  url: baseURL,
                },
                email: {
                  type: 'email',
                  to: 'test@example.com',
                  subject: [{ static: 'Test title' }],
                  body: [{ prop: 'body' }],
                } as EmailActionDefinition,
                path: {
                  type: 'request',
                  url: String(new URL('/pour?drink=coffee', baseURL)),
                },
                invalidHost: {
                  type: 'request',
                  url: 'https://invalidhost.example',
                },
              },
            },
          ],
        },
      ],
    },
  } as Partial<App>);
});

afterEach(async () => {
  await proxiedRequest.close();
});

afterEach(truncate);

afterAll(closeTestSchema);

it('should handle if the app doesn’t exist', async () => {
  const response = await request.get('/api/apps/1337/action/valid?data={}');
  expect(response).toMatchObject({
    status: 404,
    data: {
      error: 'Not Found',
      message: 'App not found',
      statusCode: 404,
    },
  });
});

it('should handle if the path doesn’t point to an action', async () => {
  const response = await request.get('/api/apps/1/action/invalid?data={}');
  expect(response).toMatchObject({
    status: 400,
    data: {
      error: 'Bad Request',
      message: 'path does not point to a proxyable action',
      statusCode: 400,
    },
  });
});

it('should proxy simple GET request actions', async () => {
  const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');
  expect(response).toMatchObject({ status: 418, data: { message: 'I’m a teapot' } });
  expect(proxiedContext.method).toBe('GET');
  expect({ ...proxiedContext.headers }).toStrictEqual({
    accept: 'application/json, text/plain, */*',
    connection: 'close',
    host: new URL(proxiedRequest.defaults.baseURL).host,
    'user-agent': `AppsembleServer/${version}`,
  });
  expect(proxiedContext.path).toBe('/');
});

it('should proxy simple DELETE request actions', async () => {
  const response = await request.delete(
    '/api/apps/1/action/pages.0.blocks.0.actions.delete?data={}',
  );
  expect(response).toMatchObject({ status: 418, data: { message: 'I’m a teapot' } });
  expect(proxiedContext.method).toBe('DELETE');
  expect({ ...proxiedContext.headers }).toStrictEqual({
    accept: 'application/json, text/plain, */*',
    connection: 'close',
    host: new URL(proxiedRequest.defaults.baseURL).host,
    'user-agent': `AppsembleServer/${version}`,
  });
  expect(proxiedContext.path).toBe('/');
});

it('should proxy simple PATCH request actions', async () => {
  const response = await request.patch('/api/apps/1/action/pages.0.blocks.0.actions.patch', {});
  expect(response).toMatchObject({ status: 418, data: { message: 'I’m a teapot' } });
  expect(proxiedContext.method).toBe('PATCH');
  expect({ ...proxiedContext.headers }).toStrictEqual({
    accept: 'application/json, text/plain, */*',
    connection: 'close',
    'content-length': '2',
    'content-type': 'application/json;charset=utf-8',
    host: new URL(proxiedRequest.defaults.baseURL).host,
    'user-agent': `AppsembleServer/${version}`,
  });
  expect(proxiedContext.path).toBe('/');
});

it('should proxy simple POST request actions', async () => {
  const response = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.post', {});
  expect(response).toMatchObject({ status: 418, data: { message: 'I’m a teapot' } });
  expect(proxiedContext.method).toBe('POST');
  expect({ ...proxiedContext.headers }).toStrictEqual({
    accept: 'application/json, text/plain, */*',
    connection: 'close',
    'content-length': '2',
    'content-type': 'application/json;charset=utf-8',
    host: new URL(proxiedRequest.defaults.baseURL).host,
    'user-agent': `AppsembleServer/${version}`,
  });
  expect(proxiedContext.path).toBe('/');
});

it('should proxy simple PUT request actions', async () => {
  const response = await request.put('/api/apps/1/action/pages.0.blocks.0.actions.put', {});
  expect(response).toMatchObject({ status: 418, data: { message: 'I’m a teapot' } });
  expect(proxiedContext.method).toBe('PUT');
  expect({ ...proxiedContext.headers }).toStrictEqual({
    accept: 'application/json, text/plain, */*',
    connection: 'close',
    'content-length': '2',
    'content-type': 'application/json;charset=utf-8',
    host: new URL(proxiedRequest.defaults.baseURL).host,
    'user-agent': `AppsembleServer/${version}`,
  });
  expect(proxiedContext.path).toBe('/');
});

it('should throw if the method doesn’t match the action method', async () => {
  const response = await request.put('/api/apps/1/action/pages.0.blocks.0.actions.post', {});
  expect(response).toMatchObject({
    status: 400,
    data: {
      error: 'Bad Request',
      message: 'Method does match the request action method',
      statusCode: 400,
    },
  });
});

it('should proxy request paths', async () => {
  const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.path?data={}');
  expect(response).toMatchObject({ status: 418, data: { message: 'I’m a teapot' } });
  expect(proxiedContext.method).toBe('GET');
  expect(proxiedContext.path).toBe('/pour');
  expect(proxiedContext.querystring).toBe('drink=coffee');
});

it('should throw if the upstream response fails', async () => {
  const response = await request.get(
    '/api/apps/1/action/pages.0.blocks.0.actions.invalidHost?data={}',
  );
  expect(response).toMatchObject({
    status: 502,
    data: {
      error: 'Bad Gateway',
      message: 'Bad Gateway',
      statusCode: 502,
    },
  });
});

it('should send emails', async () => {
  const spy = jest.spyOn(proxiedApp.context.mailer, 'sendEmail');

  const response = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', {
    body: 'Body',
  });

  expect(response.status).toBe(204);
  expect(spy).toHaveBeenCalledWith({
    to: 'Me <test@example.com>',
    subject: 'Subject',
    text: 'Body',
    html: '<p>Body</p>',
  });
  spy.mockRestore();
});

it('should not send emails if parts of it are empty', async () => {
  const response = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', {});

  expect(response).toMatchObject({
    status: 400,
    data: { message: 'Fields “to”, “subject”, and “body” must be a valid string' },
  });
});

it('should only send emails if requests are POST', async () => {
  const response = await request.put('/api/apps/1/action/pages.0.blocks.0.actions.email', {
    body: 'Body',
  });

  expect(response).toMatchObject({
    status: 405,
    data: { message: 'Method must be POST for email actions' },
  });
});

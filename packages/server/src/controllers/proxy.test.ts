import { AxiosTestInstance, createInstance } from 'axios-test-instance';
import Koa, { ParameterizedContext } from 'koa';

import { App, Organization } from '../models';
import createServer from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

let request: AxiosTestInstance;
let proxiedApp: Koa;
let proxiedContext: ParameterizedContext;
let proxiedRequest: AxiosTestInstance;

beforeAll(createTestSchema('apps'));

beforeAll(async () => {
  const server = await createServer({ argv: { host: 'http://localhost', secret: 'test' } });
  request = await createInstance(server);
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

afterAll(async () => {
  await request.close();
});

afterEach(truncate);

afterAll(closeTestSchema);

it('should handle if the app doesn’t exist', async () => {
  const response = await request.get('/api/apps/1337/proxy/valid');
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
  const response = await request.get('/api/apps/1/proxy/invalid');
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
  const response = await request.get('/api/apps/1/proxy/pages.0.blocks.0.actions.get');
  expect(response).toMatchObject({ status: 418, data: { message: 'I’m a teapot' } });
  expect(proxiedContext.method).toBe('GET');
  expect(proxiedContext.path).toBe('/');
});

it('should proxy simple DELETE request actions', async () => {
  const response = await request.delete('/api/apps/1/proxy/pages.0.blocks.0.actions.delete');
  expect(response).toMatchObject({ status: 418, data: { message: 'I’m a teapot' } });
  expect(proxiedContext.method).toBe('DELETE');
  expect(proxiedContext.path).toBe('/');
});

it('should proxy simple PATCH request actions', async () => {
  const response = await request.patch('/api/apps/1/proxy/pages.0.blocks.0.actions.patch');
  expect(response).toMatchObject({ status: 418, data: { message: 'I’m a teapot' } });
  expect(proxiedContext.method).toBe('PATCH');
  expect(proxiedContext.path).toBe('/');
});

it('should proxy simple POST request actions', async () => {
  const response = await request.post('/api/apps/1/proxy/pages.0.blocks.0.actions.post');
  expect(response).toMatchObject({ status: 418, data: { message: 'I’m a teapot' } });
  expect(proxiedContext.method).toBe('POST');
  expect(proxiedContext.path).toBe('/');
});

it('should proxy simple PUT request actions', async () => {
  const response = await request.put('/api/apps/1/proxy/pages.0.blocks.0.actions.put');
  expect(response).toMatchObject({ status: 418, data: { message: 'I’m a teapot' } });
  expect(proxiedContext.method).toBe('PUT');
  expect(proxiedContext.path).toBe('/');
});

it('should throw if the method doesn’t match the action method', async () => {
  const response = await request.put('/api/apps/1/proxy/pages.0.blocks.0.actions.post');
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
  const response = await request.get('/api/apps/1/proxy/pages.0.blocks.0.actions.path');
  expect(response).toMatchObject({ status: 418, data: { message: 'I’m a teapot' } });
  expect(proxiedContext.method).toBe('GET');
  expect(proxiedContext.path).toBe('/pour');
  expect(proxiedContext.querystring).toBe('drink=coffee');
});

it('should throw if the upstream response fails', async () => {
  const response = await request.get('/api/apps/1/proxy/pages.0.blocks.0.actions.invalidHost');
  expect(response).toMatchObject({
    status: 502,
    data: {
      error: 'Bad Gateway',
      message: 'Bad Gateway',
      statusCode: 502,
    },
  });
});

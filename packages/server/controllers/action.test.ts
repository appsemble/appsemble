import { gzipSync } from 'node:zlib';

import { type EmailActionDefinition } from '@appsemble/types';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { type AxiosTestInstance, createInstance, request, setTestApp } from 'axios-test-instance';
import Koa, { type ParameterizedContext } from 'koa';

import {
  App,
  AppMember,
  AppServiceSecret,
  Asset,
  Organization,
  type User,
} from '../models/index.js';
import pkg from '../package.json' assert { type: 'json' };
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { encrypt } from '../utils/crypto.js';
import { authorizeApp, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let server: Koa;
let user: User;
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

useTestDatabase(import.meta);

beforeEach(async () => {
  setArgv(argv);
  user = await createTestUser();
  server = await createServer({});
  await setTestApp(server);
});

it('should handle if the app doesn’t exist', async () => {
  const response = await request.get('/api/apps/1337/action/valid?data={}');
  expect(response).toMatchInlineSnapshot(`
    HTTP/1.1 404 Not Found
    Content-Type: application/json; charset=utf-8

    {
      "error": "Not Found",
      "message": "App not found",
      "statusCode": 404,
    }
  `);
});

it('should handle if the path doesn’t point to an action', async () => {
  await Organization.create({ id: 'org' });
  await App.create({
    vapidPublicKey: '',
    vapidPrivateKey: '',
    OrganizationId: 'org',
    definition: {
      defaultPage: '',
      resources: { testResource: { schema: { type: 'object' } } },
      pages: [
        {
          name: '',
          blocks: [],
        },
      ],
    },
  } as Partial<App>);
  const response = await request.get('/api/apps/1/action/invalid?data={}');
  expect(response).toMatchInlineSnapshot(`
    HTTP/1.1 400 Bad Request
    Content-Type: application/json; charset=utf-8

    {
      "error": "Bad Request",
      "message": "path does not point to a proxyable action",
      "statusCode": 400,
    }
  `);
});

describe('handleRequestProxy', () => {
  let proxiedApp: Koa;
  let proxiedContext: ParameterizedContext;
  let proxiedRequest: AxiosTestInstance;
  let proxiedBody: any;
  let responseHeaders: Record<string, string>;
  let app: App;

  beforeEach(async () => {
    vi.useFakeTimers();
    proxiedApp = new Koa().use((ctx) => {
      ctx.body = proxiedBody || { message: 'I’m a teapot' };
      ctx.status = 418;
      if (responseHeaders) {
        ctx.set(responseHeaders);
      }
      proxiedContext = ctx;
    });
    proxiedRequest = await createInstance(proxiedApp);
    const { baseURL } = proxiedRequest.defaults;
    await Organization.create({ id: 'org' });
    app = await App.create({
      vapidPublicKey: '',
      vapidPrivateKey: '',
      OrganizationId: 'org',
      definition: {
        defaultPage: '',
        roles: ['Visitor', 'Reader', 'Admin'],
        security: {
          default: {
            role: 'Reader',
            policy: 'invite',
          },
          roles: {
            Visitor: {},
            Reader: {},
            Admin: {
              inherits: ['Reader'],
            },
          },
        },
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
    proxiedBody = undefined;
    responseHeaders = undefined;
  });

  it('should proxy simple GET request actions', async () => {
    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
    expect(proxiedContext.path).toBe('/');
  });

  it('should proxy simple DELETE request actions', async () => {
    const response = await request.delete(
      '/api/apps/1/action/pages.0.blocks.0.actions.delete?data={}',
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('DELETE');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
    expect(proxiedContext.path).toBe('/');
  });

  it('should proxy simple PATCH request actions', async () => {
    const response = await request.patch('/api/apps/1/action/pages.0.blocks.0.actions.patch', {});
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('PATCH');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      'content-length': '2',
      'content-type': 'application/json',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
    expect(proxiedContext.path).toBe('/');
  });

  it('should proxy simple POST request actions', async () => {
    const response = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.post', {});
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('POST');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      'content-length': '2',
      'content-type': 'application/json',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
    expect(proxiedContext.path).toBe('/');
  });

  it('should proxy simple PUT request actions', async () => {
    const response = await request.put('/api/apps/1/action/pages.0.blocks.0.actions.put', {});
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('PUT');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      'content-length': '2',
      'content-type': 'application/json',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
    expect(proxiedContext.path).toBe('/');
  });

  it('should not decompress responses', async () => {
    responseHeaders = {
      'content-encoding': 'gzip',
      'content-type': 'application/json',
    };
    proxiedBody = gzipSync(
      JSON.stringify({
        message1: 'I’m a teapot',
        message2: 'I’m a teapot',
        message3: 'I’m a teapot',
        message4: 'I’m a teapot',
        message5: 'I’m a teapot',
        message6: 'I’m a teapot',
      }),
    );

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json

      {
        "message1": "I’m a teapot",
        "message2": "I’m a teapot",
        "message3": "I’m a teapot",
        "message4": "I’m a teapot",
        "message5": "I’m a teapot",
        "message6": "I’m a teapot",
      }
    `);
    expect(response.headers).toMatchObject({});
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
    expect(proxiedContext.path).toBe('/');
  });

  it('should throw if the method doesn’t match the action method', async () => {
    const response = await request.put('/api/apps/1/action/pages.0.blocks.0.actions.post', {});
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Method does match the request action method",
        "statusCode": 400,
      }
    `);
  });

  it('should proxy request paths', async () => {
    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.path?data={}');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect(proxiedContext.path).toBe('/pour');
    expect(proxiedContext.querystring).toBe('drink=coffee');
  });

  it('should throw if the upstream response fails', async () => {
    const response = await request.get(
      '/api/apps/1/action/pages.0.blocks.0.actions.invalidHost?data={}',
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 502 Bad Gateway
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Gateway",
        "message": "Bad Gateway",
        "statusCode": 502,
      }
    `);
  });

  it('should not apply secret if unauthorized', async () => {
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    server.context.user = null;

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
      AppId: app.id,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig.headers.Authorization).toBeUndefined();
    expect(outgoingRequestConfig.httpsAgent).toBeUndefined();
    expect(outgoingRequestConfig.params).toBeUndefined();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
  });

  it('should not apply secrets when no urls matched', async () => {
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    authorizeApp(app);

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: `!${proxiedRequest.defaults.baseURL}`,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
      AppId: app.id,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig.headers.Authorization).toBeUndefined();
    expect(outgoingRequestConfig.httpsAgent).toBeUndefined();
    expect(outgoingRequestConfig.params).toBeUndefined();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
  });

  it('should authenticate request action with HTTP basic authentication', async () => {
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    authorizeApp(app);

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
      AppId: app.id,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig.headers.Authorization).toBe(
      'Basic am9obl9kb2U6U3Ryb25nX1Bhc3N3b3JkLTEyMw==',
    );
    expect(outgoingRequestConfig.httpsAgent).toBeUndefined();
    expect(outgoingRequestConfig.params).toBeUndefined();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
  });

  it('should not authenticate request action with HTTP basic authentication when Authorization header already specified', async () => {
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    authorizeApp(app);

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
      AppId: app.id,
    });

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'not_john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
      AppId: app.id,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig.headers.Authorization).toBe(
      'Basic am9obl9kb2U6U3Ryb25nX1Bhc3N3b3JkLTEyMw==',
    );
    expect(outgoingRequestConfig.httpsAgent).toBeUndefined();
    expect(outgoingRequestConfig.params).toBeUndefined();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
  });

  it('should authenticate request action with client certificate', async () => {
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    authorizeApp(app);

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'client-certificate',
      identifier: '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
      secret: encrypt(
        '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
        argv.aesSecret,
      ),
      AppId: app.id,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig.headers.Authorization).toBeUndefined();
    expect(outgoingRequestConfig.httpsAgent).toHaveProperty(
      ['options', 'cert'],
      '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
    );
    expect(outgoingRequestConfig.httpsAgent).toHaveProperty(
      ['options', 'key'],
      '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
    );
    expect(outgoingRequestConfig.params).toBeUndefined();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
  });

  it('should not authenticate request action with client certificate when httpsAgent already present', async () => {
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    authorizeApp(app);

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'client-certificate',
      identifier: '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
      secret: encrypt(
        '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
        argv.aesSecret,
      ),
      AppId: app.id,
    });
    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'client-certificate',
      identifier: '-----BEGIN CERTIFICATE-----\nTEST1\n-----END CERTIFICATE-----',
      secret: encrypt(
        '-----BEGIN PRIVATE KEY-----\nTEST1\n-----END PRIVATE KEY-----',
        argv.aesSecret,
      ),
      AppId: app.id,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig.headers.Authorization).toBeUndefined();
    expect(outgoingRequestConfig.httpsAgent).toHaveProperty(
      ['options', 'cert'],
      '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
    );
    expect(outgoingRequestConfig.httpsAgent).toHaveProperty(
      ['options', 'key'],
      '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
    );
    expect(outgoingRequestConfig.params).toBeUndefined();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
  });

  it('should authenticate request action with client credentials', async () => {
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    authorizeApp(app);

    const tokenUrl = `${proxiedRequest.defaults.baseURL}oauth/token`;

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'client-credentials',
      identifier: 'id',
      secret: encrypt('secret', argv.aesSecret),
      tokenUrl,
      accessToken: encrypt('test', argv.aesSecret),
      expiresAt: 6 * 1e5,
      AppId: app.id,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig;

    const mock = new MockAdapter(axios);

    mock.onPost(tokenUrl).reply(200, {
      access_token: 'abcd',
      expires_in: 3600,
    });
    mock.onGet(proxiedRequest.defaults.baseURL).reply(418, { message: 'I’m a teapot' });

    const requestInterceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const responseInterceptor = axios.interceptors.response.use((response) => {
      mock.restore();
      return response;
    });

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(requestInterceptor);
    axios.interceptors.request.eject(responseInterceptor);

    expect(outgoingRequestConfig.headers.Authorization).toBe('Bearer abcd');
    expect(outgoingRequestConfig.httpsAgent).toBeUndefined();
    expect(outgoingRequestConfig.params).toBeUndefined();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
  });

  it('should not authenticate request action with client credentials when Authorization header already specified', async () => {
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    authorizeApp(app);

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
      AppId: app.id,
    });

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'client-credentials',
      identifier: 'id',
      secret: encrypt('secret', argv.aesSecret),
      tokenUrl: `${proxiedRequest.defaults.baseURL}oauth/token`,
      accessToken: encrypt('abcd', argv.aesSecret),
      expiresAt: 6 * 1e5,
      AppId: app.id,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig.headers.Authorization).toBe(
      'Basic am9obl9kb2U6U3Ryb25nX1Bhc3N3b3JkLTEyMw==',
    );
    expect(outgoingRequestConfig.httpsAgent).toBeUndefined();
    expect(outgoingRequestConfig.params).toBeUndefined();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
  });

  it('should authenticate request action with cookie', async () => {
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    authorizeApp(app);

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'cookie',
      identifier: 'cookie',
      secret: encrypt('secret', argv.aesSecret),
      AppId: app.id,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig.headers['Set-Cookie']).toBe('cookie=secret;');
    expect(outgoingRequestConfig.httpsAgent).toBeUndefined();
    expect(outgoingRequestConfig.params).toBeUndefined();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
  });

  it('should authenticate request action with 2 cookies', async () => {
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    authorizeApp(app);

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'cookie',
      identifier: 'cookie',
      secret: encrypt('secret', argv.aesSecret),
      AppId: app.id,
    });
    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'cookie',
      identifier: 'another-cookie',
      secret: encrypt('another-secret', argv.aesSecret),
      AppId: app.id,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig.headers['Set-Cookie']).toBe(
      'cookie=secret; another-cookie=another-secret;',
    );
    expect(outgoingRequestConfig.httpsAgent).toBeUndefined();
    expect(outgoingRequestConfig.params).toBeUndefined();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
  });

  it('should authenticate request action with custom header', async () => {
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    authorizeApp(app);

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'custom-header',
      identifier: 'custom-header',
      secret: encrypt('secret', argv.aesSecret),
      AppId: app.id,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig.headers['custom-header']).toBe('secret');
    expect(outgoingRequestConfig.httpsAgent).toBeUndefined();
    expect(outgoingRequestConfig.params).toBeUndefined();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
  });

  it('should not authenticate request action with header authorization', async () => {
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    authorizeApp(app);

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
      AppId: app.id,
    });
    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'custom-header',
      identifier: 'Authorization',
      secret: encrypt('secret', argv.aesSecret),
      AppId: app.id,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig.headers.Authorization).toBe(
      'Basic am9obl9kb2U6U3Ryb25nX1Bhc3N3b3JkLTEyMw==',
    );
    expect(outgoingRequestConfig.httpsAgent).toBeUndefined();
    expect(outgoingRequestConfig.params).toBeUndefined();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
  });

  it('should authenticate request action with query secret', async () => {
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    authorizeApp(app);

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'query-parameter',
      identifier: 'authKey',
      secret: encrypt('key', argv.aesSecret),
      AppId: app.id,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig.headers.Authorization).toBeUndefined();
    expect(outgoingRequestConfig.httpsAgent).toBeUndefined();
    expect(outgoingRequestConfig.params).toStrictEqual({
      authKey: 'key',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
  });

  it('should authenticate request action with 2 query secrets', async () => {
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    authorizeApp(app);

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'query-parameter',
      identifier: 'authKey',
      secret: encrypt('key', argv.aesSecret),
      AppId: app.id,
    });
    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'query-parameter',
      identifier: 'anotherOne',
      secret: encrypt('w', argv.aesSecret),
      AppId: app.id,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig.headers.Authorization).toBeUndefined();
    expect(outgoingRequestConfig.httpsAgent).toBeUndefined();
    expect(outgoingRequestConfig.params).toStrictEqual({
      authKey: 'key',
      anotherOne: 'w',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
  });

  it('should authenticate request action with multiple authentication methods', async () => {
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Admin' });
    authorizeApp(app);

    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
      AppId: app.id,
    });
    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'client-certificate',
      identifier: '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
      secret: encrypt(
        '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
        argv.aesSecret,
      ),
      AppId: app.id,
    });
    await AppServiceSecret.create({
      serviceName: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'query-parameter',
      identifier: 'authKey',
      secret: encrypt('key', argv.aesSecret),
      AppId: app.id,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/action/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig.headers.Authorization).toBe(
      'Basic am9obl9kb2U6U3Ryb25nX1Bhc3N3b3JkLTEyMw==',
    );
    expect(outgoingRequestConfig.httpsAgent).toHaveProperty(
      ['options', 'cert'],
      '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
    );
    expect(outgoingRequestConfig.httpsAgent).toHaveProperty(
      ['options', 'key'],
      '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
    );
    expect(outgoingRequestConfig.params).toStrictEqual({
      authKey: 'key',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 418 I'm a teapot
      Content-Type: application/json; charset=utf-8

      {
        "message": "I’m a teapot",
      }
    `);
    expect(proxiedContext.method).toBe('GET');
    expect({ ...proxiedContext.headers }).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, compress, deflate, br',
      host: new URL(proxiedRequest.defaults.baseURL).host,
      'user-agent': `AppsembleServer/${pkg.version}`,
    });
  });
});

describe('handleEmail', () => {
  beforeEach(async () => {
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
                  email: {
                    type: 'email',
                    to: [{ prop: 'to' }],
                    cc: [{ prop: 'cc' }],
                    bcc: [{ prop: 'bcc' }],
                    subject: [{ static: 'Test title' }],
                    body: [{ prop: 'body' }],
                    attachments: [{ prop: 'attachments' }],
                  } as EmailActionDefinition,
                },
              },
            ],
          },
        ],
      },
    } as Partial<App>);
  });

  it('should send emails', async () => {
    const spy = vi.spyOn(server.context.mailer, 'sendEmail');

    const response = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', {
      body: 'Body',
      to: 'test@example.com',
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(spy).toHaveBeenCalledWith({
      to: 'test@example.com',
      from: 'Appsemble',
      subject: 'Test title',
      html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>Body</p>
</body>
</html>
`,
      text: 'Body\n',
      attachments: [],
      app: {
        emailHost: null,
        emailName: null,
        emailPassword: null,
        emailPort: 587,
        emailSecure: true,
        emailUser: null,
        id: 1,
      },
    });
    spy.mockRestore();
  });

  it('should send mails using CC', async () => {
    const spy = vi.spyOn(server.context.mailer, 'sendEmail');
    const response = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', {
      body: 'Test',
      cc: ['test@example.com', 'John Doe <test2@example.com>'],
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(spy).toHaveBeenCalledWith({
      from: 'Appsemble',
      cc: ['test@example.com', 'John Doe <test2@example.com>'],
      subject: 'Test title',
      html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>Test</p>
</body>
</html>
`,
      text: 'Test\n',
      attachments: [],
      app: {
        emailHost: null,
        emailName: null,
        emailPassword: null,
        emailPort: 587,
        emailSecure: true,
        emailUser: null,
        id: 1,
      },
    });
    spy.mockRestore();
  });

  it('should send mails using BCC', async () => {
    const spy = vi.spyOn(server.context.mailer, 'sendEmail');
    const response = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', {
      body: 'Test',
      bcc: ['test@example.com', 'John Doe <test2@example.com>'],
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(spy).toHaveBeenCalledWith({
      from: 'Appsemble',
      bcc: ['test@example.com', 'John Doe <test2@example.com>'],
      subject: 'Test title',
      html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>Test</p>
</body>
</html>
`,
      text: 'Test\n',
      attachments: [],
      app: {
        emailHost: null,
        emailName: null,
        emailPassword: null,
        emailPort: 587,
        emailSecure: true,
        emailUser: null,
        id: 1,
      },
    });
    spy.mockRestore();
  });

  it('should do nothing if to, cc, and bcc are empty', async () => {
    const responseA = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', {
      body: 'Test',
    });

    const responseB = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', {
      to: '',
      body: 'Test',
    });

    const responseC = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', {
      cc: [],
      body: 'Test',
    });

    const responseD = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', {
      bcc: [],
      body: 'Test',
    });

    expect(responseA).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseB).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseC).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseD).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should attach URLs', async () => {
    const spy = vi.spyOn(server.context.mailer, 'sendEmail');
    const response = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', {
      to: 'test@example.com',
      body: 'Body',
      attachments: ['https://via.placeholder.com/150'],
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(spy).toHaveBeenCalledWith({
      to: 'test@example.com',
      from: 'Appsemble',
      subject: 'Test title',
      html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>Body</p>
</body>
</html>
`,
      text: 'Body\n',
      attachments: [{ path: 'https://via.placeholder.com/150' }],
      app: {
        emailHost: null,
        emailName: null,
        emailPassword: null,
        emailPort: 587,
        emailSecure: true,
        emailUser: null,
        id: 1,
      },
    });
    spy.mockRestore();
  });

  it('should attach using objects', async () => {
    const spy = vi.spyOn(server.context.mailer, 'sendEmail');
    const buffer = Buffer.from(JSON.stringify({ test: 'test' }));
    const asset = await Asset.create({
      AppId: 1,
      mime: 'application/json',
      filename: 'test.json',
      data: buffer,
    });
    const response = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', {
      to: 'test@example.com',
      body: 'Body',
      attachments: [
        { target: 'https://via.placeholder.com/150', accept: 'text/csv', filename: 'example.csv' },
        { target: asset.id, filename: 'test.json' },
      ],
      app: {
        emailHost: null,
        emailName: null,
        emailPassword: null,
        emailPort: 587,
        emailSecure: true,
        emailUser: null,
        id: 1,
      },
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(spy).toHaveBeenCalledWith({
      to: 'test@example.com',
      from: 'Appsemble',
      subject: 'Test title',
      html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>Body</p>
</body>
</html>
`,
      text: 'Body\n',
      attachments: [
        {
          filename: 'example.csv',
          httpHeaders: { accept: 'text/csv' },
          path: 'https://via.placeholder.com/150',
        },
        { content: buffer, filename: 'test.json' },
      ],
      app: {
        emailHost: null,
        emailName: null,
        emailPassword: null,
        emailPort: 587,
        emailSecure: true,
        emailUser: null,
        id: 1,
      },
    });
    spy.mockRestore();
  });

  it('should accept assets from content', async () => {
    const spy = vi.spyOn(server.context.mailer, 'sendEmail');
    const response = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', {
      to: 'test@example.com',
      body: 'Body',
      attachments: [{ content: 'Hello attachment!', filename: 'hello.txt' }],
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(spy).toHaveBeenCalledWith({
      to: 'test@example.com',
      from: 'Appsemble',
      subject: 'Test title',
      html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>Body</p>
</body>
</html>
`,
      text: 'Body\n',
      attachments: [{ content: 'Hello attachment!', filename: 'hello.txt' }],
      app: {
        emailHost: null,
        emailName: null,
        emailPassword: null,
        emailPort: 587,
        emailSecure: true,
        emailUser: null,
        id: 1,
      },
    });
  });

  it('should attach existing assets', async () => {
    const spy = vi.spyOn(server.context.mailer, 'sendEmail');
    const buffer = Buffer.from('test');
    const asset = await Asset.create({
      AppId: 1,
      mime: 'text/plain',
      filename: 'test.txt',
      data: buffer,
    });
    const response = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', {
      to: 'test@example.com',
      body: 'Body',
      attachments: [asset.id],
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(spy).toHaveBeenCalledWith({
      to: 'test@example.com',
      from: 'Appsemble',
      subject: 'Test title',
      html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>Body</p>
</body>
</html>
`,
      text: 'Body\n',
      attachments: [{ content: buffer, filename: 'test.txt' }],
      app: {
        emailHost: null,
        emailName: null,
        emailPassword: null,
        emailPort: 587,
        emailSecure: true,
        emailUser: null,
        id: 1,
      },
    });
    spy.mockRestore();
  });

  it('should not attach non-existant assets', async () => {
    const spy = vi.spyOn(server.context.mailer, 'sendEmail');
    const response = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', {
      to: 'test@example.com',
      body: 'Body',
      attachments: [100],
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(spy).toHaveBeenCalledWith({
      to: 'test@example.com',
      from: 'Appsemble',
      subject: 'Test title',
      html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>Body</p>
</body>
</html>
`,
      text: 'Body\n',
      attachments: [],
      app: {
        emailHost: null,
        emailName: null,
        emailPassword: null,
        emailPort: 587,
        emailSecure: true,
        emailUser: null,
        id: 1,
      },
    });
    spy.mockRestore();
  });

  it('should not send emails if body or subject is empty', async () => {
    const response = await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', {
      to: 'test@example.com',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Fields “subject” and “body” must be a valid string",
        "statusCode": 400,
      }
    `);
  });

  it('should only send emails if requests are POST', async () => {
    const response = await request.put('/api/apps/1/action/pages.0.blocks.0.actions.email', {
      body: 'Body',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 405 Method Not Allowed
      Content-Type: application/json; charset=utf-8

      {
        "error": "Method Not Allowed",
        "message": "Method must be POST for email actions",
        "statusCode": 405,
      }
    `);
  });

  it('should apply quotas to app emails', async () => {
    setArgv({
      ...argv,
      enableAppEmailQuota: true,
      dailyAppEmailQuota: 3,
    });
    const spy = vi.spyOn(server.context.mailer, 'sendEmail');
    const email = {
      to: 'test@example.com',
      body: 'Body',
    };

    expect(
      await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', email),
    ).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(
      await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', email),
    ).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(
      await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', email),
    ).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    expect(await request.post('/api/apps/1/action/pages.0.blocks.0.actions.email', email))
      .toMatchInlineSnapshot(`
        HTTP/1.1 429 Too Many Requests
        Content-Type: application/json; charset=utf-8

        {
          "error": "Too Many Requests",
          "message": "Too many emails sent today",
          "statusCode": 429,
        }
      `);

    spy.mockRestore();
  });
});

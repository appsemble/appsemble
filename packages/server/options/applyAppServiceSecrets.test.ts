import { type EmailActionDefinition } from '@appsemble/lang-sdk';
import { version } from '@appsemble/node-utils';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { type AxiosTestInstance, createInstance, request, setTestApp } from 'axios-test-instance';
import Koa, { type ParameterizedContext } from 'koa';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, getAppDB, Organization, type User } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { encrypt } from '../utils/crypto.js';
import { authorizeAppMember, createTestUser } from '../utils/test/authorization.js';

let server: Koa;
let user: User;
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('applyAppServiceSecrets', () => {
  let proxiedApp: Koa;
  let proxiedContext: ParameterizedContext;
  let proxiedRequest: AxiosTestInstance;
  let proxiedBody: any;
  let responseHeaders: Record<string, string>;
  let app: App;

  beforeEach(async () => {
    setArgv(argv);
    user = await createTestUser();
    server = await createServer({});
    await setTestApp(server);

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
        name: 'Test app',
        defaultPage: '',
        roles: ['Visitor', 'Reader', 'Admin'],
        security: {
          default: {
            role: 'Reader',
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
                  remap: {
                    type: 'request',
                    url: {
                      'string.format': {
                        template: `${baseURL}{dynamic}`,
                        values: {
                          dynamic: { prop: 'dynamic' },
                        },
                      },
                    },
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
    proxiedBody = undefined;
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    responseHeaders = undefined;
  });

  it('should not apply secret if unauthorized', async () => {
    const { AppMember, AppServiceSecret } = await getAppDB(app.id);
    await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    server.context.user = undefined;

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers.Authorization).toBeUndefined();
    // HttpsAgent exists (SSRF protection) but should have no secret options
    expect(outgoingRequestConfig?.httpsAgent?.options?.cert).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.key).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.ca).toBeUndefined();
    expect(outgoingRequestConfig?.params).toBeUndefined();

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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should not apply secrets when no urls matched', async () => {
    const { AppMember, AppServiceSecret } = await getAppDB(app.id);
    const member = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    authorizeAppMember(app, member);

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: `!${proxiedRequest.defaults.baseURL}`,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers.Authorization).toBeUndefined();
    // HttpsAgent exists (SSRF protection) but should have no secret options
    expect(outgoingRequestConfig?.httpsAgent?.options?.cert).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.key).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.ca).toBeUndefined();
    expect(outgoingRequestConfig?.params).toBeUndefined();

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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should not apply secrets without security definition if not opted-in', async () => {
    const { baseURL } = proxiedRequest.defaults;
    const appWithoutSecurity = await App.create({
      enableUnsecuredServiceSecrets: false,
      vapidPublicKey: '',
      vapidPrivateKey: '',
      OrganizationId: 'org',
      definition: {
        name: 'Test App',
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
                },
              },
            ],
          },
        ],
      },
    } as Partial<App>);
    const { AppMember, AppServiceSecret } = await getAppDB(appWithoutSecurity.id);
    await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get(
      `/api/apps/${appWithoutSecurity.id}/actions/pages.0.blocks.0.actions.get?data={}`,
    );

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers.Authorization).toBeUndefined();
    // HttpsAgent exists (SSRF protection) but should have no secret options
    expect(outgoingRequestConfig?.httpsAgent?.options?.cert).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.key).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.ca).toBeUndefined();
    expect(outgoingRequestConfig?.params).toBeUndefined();

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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should apply secrets without security definition if opted-in', async () => {
    const { baseURL } = proxiedRequest.defaults;
    const appWithoutSecurity = await App.create({
      enableUnsecuredServiceSecrets: true,
      vapidPublicKey: '',
      vapidPrivateKey: '',
      OrganizationId: 'org',
      definition: {
        name: 'Test App',
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
                },
              },
            ],
          },
        ],
      },
    } as Partial<App>);
    const { AppMember, AppServiceSecret } = await getAppDB(appWithoutSecurity.id);
    const member = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    authorizeAppMember(appWithoutSecurity, member);
    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get(
      `/api/apps/${appWithoutSecurity.id}/actions/pages.0.blocks.0.actions.get?data={}`,
    );

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers.Authorization).toBe(
      'Basic am9obl9kb2U6U3Ryb25nX1Bhc3N3b3JkLTEyMw==',
    );
    // HttpsAgent exists (SSRF protection) but should have no secret options
    expect(outgoingRequestConfig?.httpsAgent?.options?.cert).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.key).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.ca).toBeUndefined();
    expect(outgoingRequestConfig?.params).toBeUndefined();

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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should authenticate request action with HTTP basic authentication', async () => {
    const { AppMember, AppServiceSecret } = await getAppDB(app.id);
    const appMember = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    authorizeAppMember(app, appMember);

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers.Authorization).toBe(
      'Basic am9obl9kb2U6U3Ryb25nX1Bhc3N3b3JkLTEyMw==',
    );
    // HttpsAgent exists (SSRF protection) but should have no secret options
    expect(outgoingRequestConfig?.httpsAgent?.options?.cert).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.key).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.ca).toBeUndefined();
    expect(outgoingRequestConfig?.params).toBeUndefined();

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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should apply public secrets even if the app member is not authenticated', async () => {
    const publicPassword = encrypt('Strong_Password-123', argv.aesSecret);
    const { AppServiceSecret } = await getAppDB(app.id);
    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: publicPassword,
      public: true,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers.Authorization).toBe(
      'Basic am9obl9kb2U6U3Ryb25nX1Bhc3N3b3JkLTEyMw==',
    );
    // HttpsAgent exists (SSRF protection) but should have no secret options
    expect(outgoingRequestConfig?.httpsAgent?.options?.cert).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.key).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.ca).toBeUndefined();
    expect(outgoingRequestConfig?.params).toBeUndefined();

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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should not authenticate request action with HTTP basic authentication when Authorization header already specified', async () => {
    const { AppMember, AppServiceSecret } = await getAppDB(app.id);
    const member = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    authorizeAppMember(app, member);

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
    });

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'not_john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers.Authorization).toBe(
      'Basic am9obl9kb2U6U3Ryb25nX1Bhc3N3b3JkLTEyMw==',
    );
    // HttpsAgent exists (SSRF protection) but should have no secret options
    expect(outgoingRequestConfig?.httpsAgent?.options?.cert).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.key).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.ca).toBeUndefined();
    expect(outgoingRequestConfig?.params).toBeUndefined();

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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should authenticate request action with client certificate', async () => {
    const { AppMember, AppServiceSecret } = await getAppDB(app.id);
    const member = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    authorizeAppMember(app, member);

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'client-certificate',
      identifier: '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
      secret: encrypt(
        '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
        argv.aesSecret,
      ),
      ca: '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers.Authorization).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent).toHaveProperty(
      ['options', 'cert'],
      '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
    );
    expect(outgoingRequestConfig?.httpsAgent).toHaveProperty(
      ['options', 'key'],
      '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
    );
    expect(outgoingRequestConfig?.httpsAgent).toHaveProperty(
      ['options', 'ca'],
      '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
    );
    expect(outgoingRequestConfig?.params).toBeUndefined();

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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should not authenticate request action with client certificate when httpsAgent already present', async () => {
    const { AppMember, AppServiceSecret } = await getAppDB(app.id);
    const member = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    authorizeAppMember(app, member);

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'client-certificate',
      identifier: '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
      secret: encrypt(
        '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
        argv.aesSecret,
      ),
    });
    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'client-certificate',
      identifier: '-----BEGIN CERTIFICATE-----\nTEST1\n-----END CERTIFICATE-----',
      secret: encrypt(
        '-----BEGIN PRIVATE KEY-----\nTEST1\n-----END PRIVATE KEY-----',
        argv.aesSecret,
      ),
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers.Authorization).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent).toHaveProperty(
      ['options', 'cert'],
      '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
    );
    expect(outgoingRequestConfig?.httpsAgent).toHaveProperty(
      ['options', 'key'],
      '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
    );
    expect(outgoingRequestConfig?.params).toBeUndefined();

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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should authenticate request action with client credentials', async () => {
    const { AppMember, AppServiceSecret } = await getAppDB(app.id);
    const member = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    authorizeAppMember(app, member);

    const tokenUrl = `${proxiedRequest.defaults.baseURL}oauth/token`;

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'client-credentials',
      identifier: 'id',
      secret: encrypt('secret', argv.aesSecret),
      tokenUrl,
      accessToken: encrypt('test', argv.aesSecret),
      expiresAt: 6 * 1e5,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

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

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(requestInterceptor);
    axios.interceptors.request.eject(responseInterceptor);

    expect(outgoingRequestConfig?.headers.Authorization).toBe('Bearer abcd');
    // HttpsAgent exists (SSRF protection) but should have no secret options
    expect(outgoingRequestConfig?.httpsAgent?.options?.cert).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.key).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.ca).toBeUndefined();
    expect(outgoingRequestConfig?.params).toBeUndefined();

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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should not authenticate request action with client credentials when Authorization header already specified', async () => {
    const { AppMember, AppServiceSecret } = await getAppDB(app.id);
    const member = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    authorizeAppMember(app, member);

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
    });

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'client-credentials',
      identifier: 'id',
      secret: encrypt('secret', argv.aesSecret),
      tokenUrl: `${proxiedRequest.defaults.baseURL}oauth/token`,
      accessToken: encrypt('abcd', argv.aesSecret),
      expiresAt: 6 * 1e5,
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers.Authorization).toBe(
      'Basic am9obl9kb2U6U3Ryb25nX1Bhc3N3b3JkLTEyMw==',
    );
    // HttpsAgent exists (SSRF protection) but should have no secret options
    expect(outgoingRequestConfig?.httpsAgent?.options?.cert).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.key).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.ca).toBeUndefined();
    expect(outgoingRequestConfig?.params).toBeUndefined();

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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should authenticate request action with cookie', async () => {
    const { AppMember, AppServiceSecret } = await getAppDB(app.id);
    const member = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    authorizeAppMember(app, member);

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'cookie',
      identifier: 'cookie',
      secret: encrypt('secret', argv.aesSecret),
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers['Set-Cookie']).toBe('cookie=secret;');
    // HttpsAgent exists (SSRF protection) but should have no secret options
    expect(outgoingRequestConfig?.httpsAgent?.options?.cert).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.key).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.ca).toBeUndefined();
    expect(outgoingRequestConfig?.params).toBeUndefined();

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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should authenticate request action with 2 cookies', async () => {
    const { AppMember, AppServiceSecret } = await getAppDB(app.id);
    const member = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    authorizeAppMember(app, member);

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'cookie',
      identifier: 'cookie',
      secret: encrypt('secret', argv.aesSecret),
    });
    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'cookie',
      identifier: 'another-cookie',
      secret: encrypt('another-secret', argv.aesSecret),
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers['Set-Cookie']).toBe(
      'cookie=secret; another-cookie=another-secret;',
    );
    // HttpsAgent exists (SSRF protection) but should have no secret options
    expect(outgoingRequestConfig?.httpsAgent?.options?.cert).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.key).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.ca).toBeUndefined();
    expect(outgoingRequestConfig?.params).toBeUndefined();

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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should authenticate request action with custom header', async () => {
    const { AppMember, AppServiceSecret } = await getAppDB(app.id);
    const member = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    authorizeAppMember(app, member);

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'custom-header',
      identifier: 'custom-header',
      secret: encrypt('secret', argv.aesSecret),
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers['custom-header']).toBe('secret');
    // HttpsAgent exists (SSRF protection) but should have no secret options
    expect(outgoingRequestConfig?.httpsAgent?.options?.cert).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.key).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.ca).toBeUndefined();
    expect(outgoingRequestConfig?.params).toBeUndefined();

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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should not authenticate request action with header authorization', async () => {
    const { AppMember, AppServiceSecret } = await getAppDB(app.id);
    const member = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    authorizeAppMember(app, member);

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
    });
    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'custom-header',
      identifier: 'Authorization',
      secret: encrypt('secret', argv.aesSecret),
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers.Authorization).toBe(
      'Basic am9obl9kb2U6U3Ryb25nX1Bhc3N3b3JkLTEyMw==',
    );
    // HttpsAgent exists (SSRF protection) but should have no secret options
    expect(outgoingRequestConfig?.httpsAgent?.options?.cert).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.key).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.ca).toBeUndefined();
    expect(outgoingRequestConfig?.params).toBeUndefined();

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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should authenticate request action with query secret', async () => {
    const { AppMember, AppServiceSecret } = await getAppDB(app.id);
    const member = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    authorizeAppMember(app, member);

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'query-parameter',
      identifier: 'authKey',
      secret: encrypt('key', argv.aesSecret),
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers.Authorization).toBeUndefined();
    // HttpsAgent exists (SSRF protection) but should have no secret options
    expect(outgoingRequestConfig?.httpsAgent?.options?.cert).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.key).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.ca).toBeUndefined();
    expect(outgoingRequestConfig?.params).toStrictEqual({
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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should authenticate request action with 2 query secrets', async () => {
    const { AppMember, AppServiceSecret } = await getAppDB(app.id);
    const member = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    authorizeAppMember(app, member);

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'query-parameter',
      identifier: 'authKey',
      secret: encrypt('key', argv.aesSecret),
    });
    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'query-parameter',
      identifier: 'anotherOne',
      secret: encrypt('w', argv.aesSecret),
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers.Authorization).toBeUndefined();
    // HttpsAgent exists (SSRF protection) but should have no secret options
    expect(outgoingRequestConfig?.httpsAgent?.options?.cert).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.key).toBeUndefined();
    expect(outgoingRequestConfig?.httpsAgent?.options?.ca).toBeUndefined();
    expect(outgoingRequestConfig?.params).toStrictEqual({
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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });

  it('should authenticate request action with multiple authentication methods', async () => {
    const { AppMember, AppServiceSecret } = await getAppDB(app.id);
    const member = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Admin',
    });
    authorizeAppMember(app, member);

    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'http-basic',
      identifier: 'john_doe',
      secret: encrypt('Strong_Password-123', argv.aesSecret),
    });
    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'client-certificate',
      identifier: '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
      secret: encrypt(
        '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
        argv.aesSecret,
      ),
    });
    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: proxiedRequest.defaults.baseURL,
      authenticationMethod: 'query-parameter',
      identifier: 'authKey',
      secret: encrypt('key', argv.aesSecret),
    });

    let outgoingRequestConfig: InternalAxiosRequestConfig | undefined;

    const interceptor = axios.interceptors.request.use((config) => {
      outgoingRequestConfig = config;
      return config;
    });

    const response = await request.get('/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}');

    axios.interceptors.request.eject(interceptor);

    expect(outgoingRequestConfig?.headers.Authorization).toBe(
      'Basic am9obl9kb2U6U3Ryb25nX1Bhc3N3b3JkLTEyMw==',
    );
    expect(outgoingRequestConfig?.httpsAgent).toHaveProperty(
      ['options', 'cert'],
      '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
    );
    expect(outgoingRequestConfig?.httpsAgent).toHaveProperty(
      ['options', 'key'],
      '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
    );
    expect(outgoingRequestConfig?.params).toStrictEqual({
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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
  });
});

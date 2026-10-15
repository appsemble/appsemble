import { type EmailActionDefinition } from '@appsemble/lang-sdk';
import { version } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { type AxiosTestInstance, createInstance, request, setTestApp } from 'axios-test-instance';
import Koa, { type ParameterizedContext } from 'koa';
import { type Transporter } from 'nodemailer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  type AppMember,
  getAppDB,
  Organization,
  OrganizationMember,
  User,
} from '../models/index.js';
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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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

    const mock = new MockAdapter(axios as ConstructorParameters<typeof MockAdapter>[0]);

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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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
      HTTP/1.1 418 I'm a Teapot
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

  describe('client credentials token failures', () => {
    const day = 24 * 60 * 60 * 1e3;
    const invalidClient = {
      error: 'invalid_client',
      error_description: 'AADSTS7000215: Invalid client secret provided.',
    };
    let tokenStatus: number;
    let tokenBody: unknown;
    let tokenServer: AxiosTestInstance;
    let tokenUrl: string;
    let sendMail: ReturnType<typeof vi.fn>;
    let member: AppMember;

    beforeEach(async () => {
      const { AppMember } = await getAppDB(app.id);
      member = await AppMember.create({
        email: user.primaryEmail,
        userId: user.id,
        role: 'Admin',
      });
      authorizeAppMember(app, member);
      await OrganizationMember.create({
        OrganizationId: 'org',
        UserId: user.id,
        role: PredefinedOrganizationRole.Member,
      });
      const owner = await User.create({
        name: 'Organization Owner',
        primaryEmail: 'owner@example.com',
        timezone: 'Europe/Amsterdam',
      });
      await OrganizationMember.create({
        OrganizationId: 'org',
        UserId: owner.id,
        role: PredefinedOrganizationRole.Owner,
      });
      sendMail = vi.fn();
      server.context.mailer.transport = { sendMail } as Partial<Transporter> as Transporter;
      tokenServer = await createInstance(
        new Koa().use((ctx) => {
          ctx.status = tokenStatus;
          ctx.body = tokenBody;
        }),
      );
      tokenUrl = `${tokenServer.defaults.baseURL}oauth/token`;
    });

    afterEach(async () => {
      await tokenServer.close();
    });

    /**
     * Proxy the `get` request action while the token endpoint answers as configured.
     *
     * @param status The status the token endpoint answers with.
     * @param body The body the token endpoint answers with.
     * @returns The proxied response and the outgoing request config.
     */
    async function proxyGet(
      status: number,
      body: unknown,
    ): Promise<{ status: number; outgoing?: InternalAxiosRequestConfig }> {
      tokenStatus = status;
      tokenBody = body;
      let outgoing: InternalAxiosRequestConfig | undefined;
      const requestInterceptor = axios.interceptors.request.use((config) => {
        if (config.url === proxiedRequest.defaults.baseURL) {
          outgoing = config;
        }
        return config;
      });
      try {
        const response = await request.get(
          '/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}',
        );
        return { status: response.status, outgoing };
      } finally {
        axios.interceptors.request.eject(requestInterceptor);
      }
    }

    it('should record the provider error on the secret and email the organization owners', async () => {
      const { AppServiceSecret } = await getAppDB(app.id);
      const secret = await AppServiceSecret.create({
        name: 'Graph',
        urlPatterns: proxiedRequest.defaults.baseURL,
        authenticationMethod: 'client-credentials',
        identifier: 'id',
        secret: encrypt('expired', argv.aesSecret),
        tokenUrl,
      });

      const { outgoing, status } = await proxyGet(401, invalidClient);

      expect(status).toBe(418);
      expect(outgoing?.headers.Authorization).toBeUndefined();

      await secret.reload();
      expect(secret.lastTokenError).toBe(invalidClient.error_description);
      expect(secret.lastTokenErrorAt).toStrictEqual(new Date());

      expect(sendMail).toHaveBeenCalledTimes(1);
      const [email] = sendMail.mock.calls[0];
      expect(email.to).toBe('Organization Owner <owner@example.com>');
      expect(email.subject).toBeTruthy();
      expect(email.text).toContain(invalidClient.error_description);
      expect(email.text).toContain('Test app');
      expect(email.text).toContain('Graph');
      expect(email.text).toContain(tokenUrl);
      expect(email.text).toContain(`http://localhost/apps/${app.id}/secrets`);
    });

    it('should record transport errors without a provider response', async () => {
      const { AppServiceSecret } = await getAppDB(app.id);
      const secret = await AppServiceSecret.create({
        urlPatterns: proxiedRequest.defaults.baseURL,
        authenticationMethod: 'client-credentials',
        identifier: 'id',
        secret: encrypt('secret', argv.aesSecret),
        tokenUrl,
      });
      await tokenServer.close();

      await proxyGet(500, {});

      await secret.reload();
      expect(secret.lastTokenError).toMatch(/ECONNREFUSED/);
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail.mock.calls[0][0].text).toMatch(/ECONNREFUSED/);
    });

    it('should render provider errors as text in the owner email', async () => {
      const { AppServiceSecret } = await getAppDB(app.id);
      await AppServiceSecret.create({
        urlPatterns: proxiedRequest.defaults.baseURL,
        authenticationMethod: 'client-credentials',
        identifier: 'id',
        secret: encrypt('expired', argv.aesSecret),
        tokenUrl,
      });
      const providerError =
        'invalid_client\n\n[Renew credentials](https://attacker.example/credentials)';

      await proxyGet(401, { error: 'invalid_client', error_description: providerError });

      expect(sendMail).toHaveBeenCalledTimes(1);
      const [email] = sendMail.mock.calls[0];
      expect(email.html).toContain('[Renew credentials](https://attacker.example/credentials)');
      expect(email.html).not.toContain('href="https://attacker.example/credentials"');
    });

    it('should not change the proxied response when the notification cannot be sent', async () => {
      const { AppServiceSecret } = await getAppDB(app.id);
      const secret = await AppServiceSecret.create({
        urlPatterns: proxiedRequest.defaults.baseURL,
        authenticationMethod: 'client-credentials',
        identifier: 'id',
        secret: encrypt('expired', argv.aesSecret),
        tokenUrl,
      });
      sendMail.mockRejectedValue(new Error('SMTP down'));

      const { status } = await proxyGet(401, invalidClient);

      expect(status).toBe(418);
      await secret.reload();
      expect(secret.lastTokenError).toBe(invalidClient.error_description);
    });

    it('should not change the proxied response when looking up notification recipients fails', async () => {
      const { AppServiceSecret } = await getAppDB(app.id);
      const secret = await AppServiceSecret.create({
        urlPatterns: proxiedRequest.defaults.baseURL,
        authenticationMethod: 'client-credentials',
        identifier: 'id',
        secret: encrypt('expired', argv.aesSecret),
        tokenUrl,
      });
      const ownerLookup = vi
        .spyOn(OrganizationMember, 'findAll')
        .mockRejectedValueOnce(new Error('Database unavailable'));

      let status: number;
      try {
        ({ status } = await proxyGet(401, invalidClient));
      } finally {
        ownerLookup.mockRestore();
      }

      expect(status).toBe(418);
      await secret.reload();
      expect(secret.lastTokenError).toBe(invalidClient.error_description);
    });

    it('should email the organization owners at most once per day per secret', async () => {
      const { AppServiceSecret } = await getAppDB(app.id);
      const secret = await AppServiceSecret.create({
        name: 'Graph',
        urlPatterns: proxiedRequest.defaults.baseURL,
        authenticationMethod: 'client-credentials',
        identifier: 'id',
        secret: encrypt('expired', argv.aesSecret),
        tokenUrl,
      });
      const firstFailure = new Date();

      expect((await proxyGet(401, invalidClient)).status).toBe(418);
      vi.advanceTimersByTime(day - 1e3);
      // The app member's access token has expired along with the clock.
      authorizeAppMember(app, member);
      expect((await proxyGet(400, { error: 'invalid_grant' })).status).toBe(418);

      expect(sendMail).toHaveBeenCalledTimes(1);
      await secret.reload();
      expect(secret.lastTokenError).toBe('invalid_grant');
      expect(secret.lastTokenErrorAt).toStrictEqual(new Date());
      expect(secret.lastTokenErrorNotifiedAt).toStrictEqual(firstFailure);

      vi.advanceTimersByTime(2e3);
      expect((await proxyGet(401, invalidClient)).status).toBe(418);

      expect(sendMail).toHaveBeenCalledTimes(2);
      await secret.reload();
      expect(secret.lastTokenErrorNotifiedAt).toStrictEqual(new Date());
    });

    it('should email the organization owners once for concurrent failures', async () => {
      const { AppServiceSecret } = await getAppDB(app.id);
      await AppServiceSecret.create({
        name: 'Graph',
        urlPatterns: proxiedRequest.defaults.baseURL,
        authenticationMethod: 'client-credentials',
        identifier: 'id',
        secret: encrypt('expired', argv.aesSecret),
        tokenUrl,
      });

      const responses = await Promise.all([
        proxyGet(401, invalidClient),
        proxyGet(401, invalidClient),
      ]);

      expect(responses.map(({ status }) => status)).toStrictEqual([418, 418]);
      expect(sendMail).toHaveBeenCalledTimes(1);
    });

    it('should ignore a token failure from credentials that were replaced in flight', async () => {
      const { promise: waitForRelease, resolve: releaseTokenRequest } =
        Promise.withResolvers<boolean>();
      const { promise: waitForTokenRequest, resolve: tokenRequestStarted } =
        Promise.withResolvers<boolean>();
      await tokenServer.close();
      tokenServer = await createInstance(
        new Koa().use(async (ctx) => {
          tokenRequestStarted(true);
          await waitForRelease;
          ctx.status = 401;
          ctx.body = invalidClient;
        }),
      );
      tokenUrl = `${tokenServer.defaults.baseURL}oauth/token`;
      const { AppServiceSecret } = await getAppDB(app.id);
      const secret = await AppServiceSecret.create({
        urlPatterns: proxiedRequest.defaults.baseURL,
        authenticationMethod: 'client-credentials',
        identifier: 'id',
        secret: encrypt('expired', argv.aesSecret),
        tokenUrl,
      });

      const responsePromise = proxyGet(401, invalidClient);
      await waitForTokenRequest;
      try {
        await secret.update({
          secret: encrypt('renewed', argv.aesSecret),
          lastTokenError: null,
          lastTokenErrorAt: null,
          lastTokenErrorNotifiedAt: null,
        });
      } finally {
        releaseTokenRequest(true);
      }
      const { status } = await responsePromise;

      expect(status).toBe(418);
      await secret.reload();
      expect(secret.lastTokenError).toBeNull();
      expect(secret.lastTokenErrorAt).toBeNull();
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('should clear the recorded error once a token request succeeds', async () => {
      const { AppServiceSecret } = await getAppDB(app.id);
      const notifiedAt = new Date(Date.now() - 60 * 1e3);
      const secret = await AppServiceSecret.create({
        urlPatterns: proxiedRequest.defaults.baseURL,
        authenticationMethod: 'client-credentials',
        identifier: 'id',
        secret: encrypt('renewed', argv.aesSecret),
        tokenUrl,
        lastTokenError: invalidClient.error_description,
        lastTokenErrorAt: notifiedAt,
        lastTokenErrorNotifiedAt: notifiedAt,
      });

      const { outgoing } = await proxyGet(200, { access_token: 'abcd', expires_in: 3600 });

      expect(outgoing?.headers.Authorization).toBe('Bearer abcd');
      await secret.reload();
      expect(secret.lastTokenError).toBeNull();
      expect(secret.lastTokenErrorAt).toBeNull();
      expect(secret.lastTokenErrorNotifiedAt).toStrictEqual(notifiedAt);
      expect(sendMail).not.toHaveBeenCalled();
    });
  });
});

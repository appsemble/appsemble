import { type EmailActionDefinition } from '@appsemble/lang-sdk';
import { version } from '@appsemble/node-utils';
import { type AxiosTestInstance, createInstance, request, setTestApp } from 'axios-test-instance';
import Koa, { type ParameterizedContext } from 'koa';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, Organization } from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { createTestUser } from '../../../utils/test/authorization.js';

let server: Koa;
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('proxyPatch', () => {
  let proxiedApp: Koa;
  let proxiedContext: ParameterizedContext;
  let proxiedRequest: AxiosTestInstance;
  let proxiedBody: any;
  let responseHeaders: Record<string, string>;

  beforeEach(async () => {
    setArgv(argv);
    await createTestUser();
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
    await App.create({
      vapidPublicKey: '',
      vapidPrivateKey: '',
      OrganizationId: 'org',
      definition: {
        name: 'Test App',
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

  it('should proxy simple PATCH request actions', async () => {
    const response = await request.patch('/api/apps/1/actions/pages.0.blocks.0.actions.patch', {});
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
      host: new URL(proxiedRequest.defaults.baseURL!).host,
      'user-agent': `AppsembleServer/${version}`,
    });
    expect(proxiedContext.path).toBe('/');
  });
});

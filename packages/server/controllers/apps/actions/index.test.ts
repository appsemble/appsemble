import { gzipSync } from 'node:zlib';

import { type EmailActionDefinition } from '@appsemble/lang-sdk';
import { uploadS3File, version } from '@appsemble/node-utils';
import { type AxiosTestInstance, createInstance, request, setTestApp } from 'axios-test-instance';
import Koa, { type ParameterizedContext } from 'koa';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, getAppDB, Organization } from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { createTestUser } from '../../../utils/test/authorization.js';

let server: Koa;
let testApp: AxiosTestInstance;
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('actions', () => {
  beforeEach(async () => {
    setArgv(argv);
    await createTestUser();
    server = await createServer({});
    testApp = await setTestApp(server);
  });

  it('should handle if the app doesn’t exist', async () => {
    const response = await request.get('/api/apps/1337/actions/valid?data={}');
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
        name: 'Test App',
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
    const response = await request.get('/api/apps/1/actions/invalid?data={}');
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

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}',
      );
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
        host: new URL(proxiedRequest.defaults.baseURL!).host,
        'user-agent': `AppsembleServer/${version}`,
      });
      expect(proxiedContext.path).toBe('/');
    });

    it('should throw if the method doesn’t match the action method', async () => {
      const response = await request.put('/api/apps/1/actions/pages.0.blocks.0.actions.post', {});
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 400 Bad Request
        Content-Type: application/json; charset=utf-8

        {
          "error": "Bad Request",
          "message": "Method does not match the request action method",
          "statusCode": 400,
        }
      `);
    });

    it('should assign incoming content-type when present', async () => {
      const response = await request.post(
        '/api/apps/1/actions/pages.0.blocks.0.actions.post',
        await new Blob([], { type: 'image/png' }).arrayBuffer(),
        {
          headers: {
            'Content-Type': 'image/png',
          },
        },
      );
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
        host: new URL(proxiedRequest.defaults.baseURL!).host,
        'user-agent': `AppsembleServer/${version}`,
        'content-type': 'image/png',
      });
    });

    it('should remap url on server', async () => {
      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.remap?data={"dynamic": "path"}',
      );
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 418 I'm a teapot
        Content-Type: application/json; charset=utf-8

        {
          "message": "I’m a teapot",
        }
      `);
      expect(proxiedContext.method).toBe('GET');
      expect(proxiedContext.url).toBe('/path');
    });

    it('throw if url matches itself', async () => {
      await App.create({
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
                    sameHost: {
                      type: 'request',
                      url: `${testApp.defaults.baseURL}api/apps/2/actions/pages.0.blocks.0.actions.sameHost?data={}`,
                    },
                  },
                },
              ],
            },
          ],
        },
      } as Partial<App>);
      const response = await request.get(
        '/api/apps/2/actions/pages.0.blocks.0.actions.sameHost?data={}',
      );
      expect(response.status).toBe(400);
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 400 Bad Request
        Content-Type: application/json; charset=utf-8

        {
          "error": "Bad Request",
          "message": "Not allowed to make direct requests to the Appsemble action controller using this action.",
          "statusCode": 400,
        }
      `);
    });

    it('should not throw if hostname does not match', async () => {
      const remoteApp = new Koa();
      remoteApp.use((ctx) => {
        ctx.status = 418;
        ctx.body = { message: 'I’m a teapot' };
      });
      const remoteServer = await createInstance(remoteApp);
      const remoteUrl = `${remoteServer.defaults.baseURL}api/apps/2/actions/pages.0.blocks.0.actions.differentHost?data={}`;

      await App.create({
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
                    differentHost: {
                      type: 'request',
                      url: { static: remoteUrl },
                    },
                  },
                },
              ],
            },
          ],
        },
      } as Partial<App>);

      const response = await request.get(
        '/api/apps/2/actions/pages.0.blocks.0.actions.differentHost?data={}',
      );

      // TODO: instead ensure the remapped url requested (in the controller) matched the remote url
      expect(remoteServer.defaults.baseURL).not.toBe(proxiedRequest.defaults.baseURL);
      expect(response.status).toBe(418);
      expect(response.data).toStrictEqual({
        message: 'I’m a teapot',
      });
    });

    it('should throw if data is not a JSON object', async () => {
      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.get?data=test',
      );
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 400 Bad Request
        Content-Type: application/json; charset=utf-8

        {
          "error": "Bad Request",
          "message": "data should be a JSON object.",
          "statusCode": 400,
        }
      `);
    });

    it('should proxy query parameters', async () => {
      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}&params={"key": "value"}',
      );
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 418 I'm a teapot
        Content-Type: application/json; charset=utf-8

        {
          "message": "I’m a teapot",
        }
      `);
      expect(proxiedContext.method).toBe('GET');
      expect(proxiedContext.querystring).toBe('key=value');
    });

    it('should throw if params is not a JSON object', async () => {
      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.get?data={}&params=test',
      );
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 400 Bad Request
        Content-Type: application/json; charset=utf-8

        {
          "error": "Bad Request",
          "message": "params should be a JSON object.",
          "statusCode": 400,
        }
      `);
    });

    it('should proxy request paths', async () => {
      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.path?data={}',
      );
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
        '/api/apps/1/actions/pages.0.blocks.0.actions.invalidHost?data={}',
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
  });

  describe('handleEmail', () => {
    beforeEach(async () => {
      await Organization.create({ id: 'org' });
      await App.create({
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

      const response = await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', {
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
<meta content="width=device-width, initial-scale=1" name="viewport">
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
      const response = await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', {
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
<meta content="width=device-width, initial-scale=1" name="viewport">
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
      const response = await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', {
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
<meta content="width=device-width, initial-scale=1" name="viewport">
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
      const responseA = await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', {
        body: 'Test',
      });

      const responseB = await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', {
        to: '',
        body: 'Test',
      });

      const responseC = await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', {
        cc: [],
        body: 'Test',
      });

      const responseD = await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', {
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
      const response = await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', {
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
<meta content="width=device-width, initial-scale=1" name="viewport">
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
      const { Asset } = await getAppDB(1);
      const asset = await Asset.create({
        mime: 'application/json',
        filename: 'test.json',
      });
      await uploadS3File(`app-${1}`, asset.id, buffer);
      const response = await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', {
        to: 'test@example.com',
        body: 'Body',
        attachments: [
          {
            target: 'https://via.placeholder.com/150',
            accept: 'text/csv',
            filename: 'example.csv',
          },
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
<meta content="width=device-width, initial-scale=1" name="viewport">
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
      const response = await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', {
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
<meta content="width=device-width, initial-scale=1" name="viewport">
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
      const { Asset } = await getAppDB(1);
      const asset = await Asset.create({
        mime: 'text/plain',
        filename: 'test.txt',
      });
      await uploadS3File(`app-${1}`, asset.id, buffer);
      const response = await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', {
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
<meta content="width=device-width, initial-scale=1" name="viewport">
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
      const response = await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', {
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
<meta content="width=device-width, initial-scale=1" name="viewport">
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
      const response = await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', {
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
      const response = await request.put('/api/apps/1/actions/pages.0.blocks.0.actions.email', {
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
        await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', email),
      ).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
      expect(
        await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', email),
      ).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
      expect(
        await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', email),
      ).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

      expect(await request.post('/api/apps/1/actions/pages.0.blocks.0.actions.email', email))
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
});

// eslint-disable-next-line unicorn/import-style
import crypto from 'node:crypto';

import { type AppDefinition } from '@appsemble/lang-sdk';
import {
  errorMiddleware,
  logger,
  type AppServingCache,
  type AppServingCacheResult,
} from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppBuildSnapshot,
  AppMessages,
  AppSnapshot,
  BlockAsset,
  BlockVersion,
  Organization,
} from '../../models/index.js';
import { options } from '../../options/options.js';
import { appRouter } from './index.js';
import { setArgv } from '../../utils/argv.js';
import { appServingCache } from '../../utils/serverCache.js';

let requestURL: URL;

function parseCsp(csp: string): Record<string, string[]> {
  return Object.fromEntries(
    csp.split('; ').map((directive) => {
      const [name, ...values] = directive.split(' ');
      return [name, values];
    }),
  );
}

function parseSettingsScript(settings: string): {
  definition: AppDefinition & Record<string, unknown>;
} {
  return JSON.parse(settings.slice('<script>window.settings='.length, -'</script>'.length)) as {
    definition: AppDefinition & Record<string, unknown>;
  };
}

function createTestCache(): AppServingCache & { keys: () => IterableIterator<string> } {
  const store = new Map<string, unknown>();

  return {
    get: vi.fn(<T>(key: string): Promise<AppServingCacheResult<T>> =>
      Promise.resolve(
        store.has(key)
          ? { status: 'hit' as const, value: store.get(key) as T }
          : { status: 'miss' as const },
      ),
    ),
    keys: store.keys.bind(store),
    set: vi.fn((key: string, value: unknown) => {
      store.set(key, value);
      return Promise.resolve('miss' as const);
    }),
  } as AppServingCache & { keys: () => IterableIterator<string> };
}

describe('indexHandler', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  beforeEach(() => {
    vi.spyOn(crypto, 'randomBytes').mockImplementation((size) => Buffer.alloc(size));
  });

  beforeEach(async () => {
    await Organization.create({ id: 'test' });
    await Organization.create({ id: 'appsemble' });

    const [a00, a01, b00, b02, a10, a11, b10, b12] = await BlockVersion.bulkCreate([
      { name: 'a', OrganizationId: 'test', version: '0.0.0' },
      { name: 'a', OrganizationId: 'test', version: '0.0.1' },
      { name: 'b', OrganizationId: 'test', version: '0.0.0' },
      { name: 'b', OrganizationId: 'test', version: '0.0.2' },
      { name: 'a', OrganizationId: 'appsemble', version: '0.1.0' },
      { name: 'a', OrganizationId: 'appsemble', version: '0.1.1' },
      { name: 'b', OrganizationId: 'appsemble', version: '0.1.0' },
      { name: 'b', OrganizationId: 'appsemble', version: '0.1.2' },
    ]);
    await BlockAsset.bulkCreate([
      {
        OrganizationId: 'test',
        BlockVersionId: a00.id,
        filename: 'a0.js',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'test',
        BlockVersionId: a00.id,
        filename: 'a0.css',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'test',
        BlockVersionId: a01.id,
        filename: 'a1.js',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'test',
        BlockVersionId: a01.id,
        filename: 'a1.css',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'test',
        BlockVersionId: b00.id,
        filename: 'b0.js',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'test',
        BlockVersionId: b00.id,
        filename: 'b0.css',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'test',
        BlockVersionId: b02.id,
        filename: 'b2.js',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'test',
        BlockVersionId: b02.id,
        filename: 'b2.css',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: a10.id,
        filename: 'a0.js',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: a10.id,
        filename: 'a0.css',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: a11.id,
        filename: 'a1.js',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: a11.id,
        filename: 'a1.css',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: b10.id,
        filename: 'b0.js',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: b10.id,
        filename: 'b0.css',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: b12.id,
        filename: 'b2.js',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: b12.id,
        filename: 'b2.css',
        content: Buffer.from(''),
      },
    ]);
    setArgv({ host: 'http://host.example', secret: 'test' });
    options.appServingCache = appServingCache;
    const server = new Koa()
      .use((ctx, next) => {
        Object.defineProperty(ctx, 'URL', { get: () => requestURL });
        Object.defineProperty(ctx, 'hostname', { get: () => requestURL.hostname });
        return next();
      })
      .use(errorMiddleware())
      .use(appRouter);
    await setTestApp(server);
  });

  beforeEach(() => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
    requestURL = new URL('http://app.test.host.example');
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should render the index page', async () => {
    const app = await App.create({
      OrganizationId: 'test',
      definition: {
        name: 'Test App',
        pages: [
          {
            name: 'Test Page',
            blocks: [
              { type: '@test/a', version: '0.0.0' },
              { type: 'a', version: '0.1.0' },
              { type: 'a', version: '0.1.0' },
            ],
          },
          {
            name: 'Test Page with Flow',
            type: 'flow',
            steps: [
              {
                blocks: [
                  { type: 'a', version: '0.1.0' },
                  {
                    type: 'a',
                    version: '0.1.1',
                    actions: { whatever: { blocks: [{ type: '@test/b', version: '0.0.2' }] } },
                  },
                ],
              },
            ],
          },
        ],
      },
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });
    await AppMessages.bulkCreate([
      {
        AppId: app.id,
        language: 'en',
        messages: '{ greet: Hi! }',
      },
      {
        AppId: app.id,
        language: 'nl',
        messages: '{ greet: Hoi! }',
      },
    ]);

    const response = await request.get('/');

    const nonce = 'AAAAAAAAAAAAAAAAAAAAAA==';

    response.data.data = {
      ...response.data.data,
      nonce,
    };

    const csp = response.headers['content-security-policy'] as string;
    if (csp.includes('nonce-')) {
      const responseNonce = csp.slice(csp.indexOf('nonce-') + 6, csp.indexOf('nonce-') + 30);
      response.headers['content-security-policy'] = csp.replace(responseNonce, nonce);
    }

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Security-Policy: base-uri 'self'; connect-src * blob: data:; default-src 'self'; font-src * data:; frame-ancestors http://host.example; frame-src 'self' *.vimeo.com *.weseedo.nl *.youtube.com blob: http://host.example; img-src * blob: data: http://host.example; media-src * blob: data: http://host.example; object-src * blob: data: http://host.example; script-src 'nonce-AAAAAAAAAAAAAAAAAAAAAA==' 'self' 'sha256-zCYrniI+9/bTmzwyYtPfYOHkPht43kpSB8FKKbsGTl4=' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; worker-src 'self' blob:
      Content-Type: text/html; charset=utf-8
      Referrer-Policy: strict-origin-when-cross-origin
      X-Appsemble-Messages-Cache: miss
      X-Appsemble-Settings-Cache: miss

      {
        "data": {
          "app": {
            "$created": "1970-01-01T00:00:00.000Z",
            "$updated": "1970-01-01T00:00:00.000Z",
            "OrganizationId": "test",
            "controllerCode": null,
            "controllerImplementations": null,
            "coreStyle": "",
            "definition": {
              "name": "Test App",
              "pages": [
                {
                  "blocks": [
                    {
                      "type": "@test/a",
                      "version": "0.0.0",
                    },
                    {
                      "type": "a",
                      "version": "0.1.0",
                    },
                    {
                      "type": "a",
                      "version": "0.1.0",
                    },
                  ],
                  "name": "Test Page",
                },
                {
                  "name": "Test Page with Flow",
                  "steps": [
                    {
                      "blocks": [
                        {
                          "type": "a",
                          "version": "0.1.0",
                        },
                        {
                          "actions": {
                            "whatever": {
                              "blocks": [
                                {
                                  "type": "@test/b",
                                  "version": "0.0.2",
                                },
                              ],
                            },
                          },
                          "type": "a",
                          "version": "0.1.1",
                        },
                      ],
                    },
                  ],
                  "type": "flow",
                },
              ],
            },
            "demoMode": false,
            "displayAppMemberName": false,
            "displayInstallationPrompt": false,
            "domain": null,
            "emailName": null,
            "enableSelfRegistration": true,
            "enableUnsecuredServiceSecrets": false,
            "googleAnalyticsID": null,
            "hasIcon": false,
            "hasMaskableIcon": false,
            "iconBackground": "#ffffff",
            "iconUrl": null,
            "id": 1,
            "locked": "unlocked",
            "metaPixelID": null,
            "msClarityID": null,
            "path": "app",
            "sentryDsn": null,
            "sentryEnvironment": null,
            "sharedStyle": "",
            "showAppDefinition": false,
            "showAppsembleLogin": false,
            "showAppsembleOAuth2Login": true,
            "skipGroupInvites": false,
            "supportedLanguages": null,
            "template": false,
            "totp": "disabled",
            "visibility": "unlisted",
            "yaml": "name: Test App
      pages:
        - name: Test Page
          blocks:
            - type: "@test/a"
              version: 0.0.0
            - type: a
              version: 0.1.0
            - type: a
              version: 0.1.0
        - name: Test Page with Flow
          type: flow
          steps:
            - blocks:
                - type: a
                  version: 0.1.0
                - type: a
                  version: 0.1.1
                  actions:
                    whatever:
                      blocks:
                        - type: "@test/b"
                          version: 0.0.2
      ",
          },
          "appUpdated": "1970-01-01T00:00:00.000Z",
          "appUrl": "http://app.test.host.example/",
          "bulmaURL": "/bulma/0.9.4/bulma.min.css?dangerColor=%23ff2800&fontFamily=Open+Sans&fontSource=google&infoColor=%23a7d0ff&linkColor=%230440ad&primaryColor=%235393ff&splashColor=%23ffffff&successColor=%231fd25b&themeColor=%23ffffff&tileLayer=https%3A%2F%2F%7Bs%7D.tile.openstreetmap.org%2F%7Bz%7D%2F%7Bx%7D%2F%7By%7D.png&warningColor=%23fed719",
          "faURL": "/fa/6.7.2/css/all.min.css",
          "host": "http://host.example",
          "locale": "en",
          "locales": [
            "nl",
          ],
          "noIndex": true,
          "nonce": "AAAAAAAAAAAAAAAAAAAAAA==",
          "settings": "<script>window.settings={"apiUrl":"http://host.example","appControllerCode":null,"appControllerImplementations":null,"blockManifests":[{"name":"@appsemble/a","version":"0.1.0","layout":null,"actions":null,"events":null,"files":["a0.css","a0.js"]},{"name":"@appsemble/a","version":"0.1.1","layout":null,"actions":null,"events":null,"files":["a1.css","a1.js"]},{"name":"@test/a","version":"0.0.0","layout":null,"actions":null,"events":null,"files":["a0.css","a0.js"]},{"name":"@test/b","version":"0.0.2","layout":null,"actions":null,"events":null,"files":["b2.css","b2.js"]}],"id":1,"languages":["en","nl"],"logins":[],"vapidPublicKey":"","definition":{"name":"Test App","pages":[{"name":"Test Page","blocks":[{"type":"@test/a","version":"0.0.0"},{"type":"a","version":"0.1.0"},{"type":"a","version":"0.1.0"}]},{"name":"Test Page with Flow","type":"flow","steps":[{"blocks":[{"type":"a","version":"0.1.0"},{"type":"a","version":"0.1.1","actions":{"whatever":{"blocks":[{"type":"@test/b","version":"0.0.2"}]}}}]}]}]},"demoMode":false,"showAppsembleLogin":false,"displayAppMemberName":false,"displayInstallationPrompt":false,"showAppsembleOAuth2Login":true,"enableSelfRegistration":true,"showDemoLogin":false,"totp":"disabled","appUpdated":"1970-01-01T00:00:00.000Z","supportedLanguages":["en"]}</script>",
          "themeColor": "#ffffff",
        },
        "filename": "app/index.html",
      }
    `);
  });

  it('should cache app messages and settings for repeated app loads', async () => {
    const cache = createTestCache();
    options.appServingCache = cache;
    const app = await App.create({
      OrganizationId: 'test',
      definition: {
        name: 'Test App',
        pages: [{ name: 'Test Page', blocks: [{ type: '@test/a', version: '0.0.0' }] }],
      },
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });
    await AppMessages.create({
      AppId: app.id,
      language: 'en',
      messages: { app: { description: 'Test app' }, messageIds: {} },
    });

    const firstResponse = await request.get('/');
    const secondResponse = await request.get('/');

    expect(firstResponse.headers['x-appsemble-messages-cache']).toBe('miss');
    expect(firstResponse.headers['x-appsemble-settings-cache']).toBe('miss');
    expect(secondResponse.headers['x-appsemble-messages-cache']).toBe('hit');
    expect(secondResponse.headers['x-appsemble-settings-cache']).toBe('hit');
    secondResponse.data.data.nonce = firstResponse.data.data.nonce;
    expect(secondResponse.data).toStrictEqual(firstResponse.data);
  });

  it('should miss the settings cache when the latest snapshot changes', async () => {
    const cache = createTestCache();
    options.appServingCache = cache;
    const app = await App.create({
      OrganizationId: 'test',
      definition: {
        name: 'Test App',
        pages: [{ name: 'Test Page', blocks: [{ type: '@test/a', version: '0.0.0' }] }],
      },
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });
    await AppMessages.create({
      AppId: app.id,
      language: 'en',
      messages: { app: { description: 'Test app' }, messageIds: {} },
    });

    await request.get('/');
    await AppSnapshot.create({ AppId: app.id, yaml: 'name: Test App\npages: []\n' });
    const response = await request.get('/');

    expect(response.headers['x-appsemble-messages-cache']).toBe('hit');
    expect(response.headers['x-appsemble-settings-cache']).toBe('miss');
    expect([...cache.keys()].filter((key) => key.startsWith('app-settings:'))).toHaveLength(2);
  });

  it('should omit security permission mappings from bootstrapped settings if showAppDefinition is false', async () => {
    await App.create({
      OrganizationId: 'test',
      definition: {
        name: 'Test App',
        defaultPage: 'Home',
        pages: [],
        security: {
          guest: {
            permissions: ['$resource:example:query'],
          },
          cron: {
            permissions: ['$resource:example:create'],
          },
          default: {
            role: 'User',
          },
          roles: {
            User: {
              defaultPage: 'Home',
              permissions: ['$resource:example:query'],
            },
            Manager: {
              defaultPage: 'Admin',
              description: 'Manager',
              inherits: ['User'],
              permissions: ['$resource:example:create'],
            },
          },
        },
      },
      showAppDefinition: false,
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });

    const response = await request.get('/');
    const settings = parseSettingsScript(response.data.data.settings);

    expect(settings.definition.security).toStrictEqual({
      guest: {},
      cron: {},
      default: {
        role: 'User',
      },
      roles: {
        User: {
          defaultPage: 'Home',
        },
        Manager: {
          defaultPage: 'Admin',
          description: 'Manager',
          inherits: ['User'],
        },
      },
    });
  });

  it('should keep security permission mappings in bootstrapped settings if showAppDefinition is true', async () => {
    await App.create({
      OrganizationId: 'test',
      definition: {
        name: 'Test App',
        defaultPage: 'Home',
        pages: [],
        security: {
          guest: {
            permissions: ['$resource:example:query'],
          },
          cron: {
            permissions: ['$resource:example:create'],
          },
          default: {
            role: 'User',
          },
          roles: {
            User: {
              defaultPage: 'Home',
              permissions: ['$resource:example:query'],
            },
          },
        },
      },
      showAppDefinition: true,
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });

    const response = await request.get('/');
    const settings = parseSettingsScript(response.data.data.settings);

    expect(settings.definition.security).toStrictEqual({
      guest: {
        permissions: ['$resource:example:query'],
      },
      cron: {
        permissions: ['$resource:example:create'],
      },
      default: {
        role: 'User',
      },
      roles: {
        User: {
          defaultPage: 'Home',
          permissions: ['$resource:example:query'],
        },
      },
    });
  });

  it('should omit non-bootstrapped app definition fields from bootstrapped settings', async () => {
    await App.create({
      OrganizationId: 'test',
      definition: {
        name: 'Test App',
        description: 'Private description',
        defaultLanguage: 'nl',
        defaultPage: 'Home',
        layout: {
          login: 'navbar',
          settings: 'navigation',
          feedback: 'navigation',
          install: 'hidden',
          debug: 'navigation',
          enabledSettings: ['name', 'email', 'phoneNumber'],
          navigation: 'left-menu',
          logo: {
            position: 'navbar',
            asset: 'logo',
          },
          headerTag: {
            text: 'Beta',
            hide: false,
          },
          titleBarText: 'appName',
          hideTitleBar: true,
        },
        notifications: 'login',
        pages: [
          {
            name: 'Home',
            blocks: [],
          },
        ],
        members: {
          phoneNumber: {
            enable: true,
            required: true,
          },
          properties: {
            privateField: {
              schema: {
                type: 'string',
              },
            },
          },
        },
        resources: {
          example: {
            schema: {
              type: 'object',
            },
          },
        },
        security: {
          guest: {
            permissions: ['$resource:example:query'],
          },
        },
        theme: {
          themeColor: '#111111',
        },
        contentSecurityPolicy: {
          'connect-src': ['https://internal.example'],
        },
        anchors: [{ private: true }],
        cron: {
          sync: {
            schedule: '* * * * *',
            action: { type: 'noop' },
          },
        },
        webhooks: {
          ingest: {
            schema: {
              type: 'object',
            },
            action: { type: 'noop' },
          },
        },
        containers: [
          {
            name: 'api',
            image: 'private.example/api',
            port: 8080,
            env: [
              {
                name: 'TOKEN',
                value: 'secret',
              },
            ],
          },
        ],
        registry: 'private.example',
      },
      showAppDefinition: true,
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });

    const response = await request.get('/');
    const settings = parseSettingsScript(response.data.data.settings);

    expect(settings.definition).toStrictEqual({
      defaultLanguage: 'nl',
      defaultPage: 'Home',
      layout: {
        debug: 'navigation',
        enabledSettings: ['name', 'email', 'phoneNumber'],
        feedback: 'navigation',
        headerTag: {
          text: 'Beta',
          hide: false,
        },
        hideTitleBar: true,
        install: 'hidden',
        login: 'navbar',
        logo: {
          position: 'navbar',
          asset: 'logo',
        },
        navigation: 'left-menu',
        settings: 'navigation',
        titleBarText: 'appName',
      },
      members: {
        phoneNumber: {
          enable: true,
          required: true,
        },
      },
      name: 'Test App',
      notifications: 'login',
      pages: [
        {
          name: 'Home',
          blocks: [],
        },
      ],
      resources: {
        example: {
          schema: {
            type: 'object',
          },
        },
      },
      security: {
        guest: {
          permissions: ['$resource:example:query'],
        },
      },
      theme: {
        themeColor: '#111111',
      },
    });
  });

  it('should render the index page with dynamic scripts', async () => {
    const app = await App.create({
      OrganizationId: 'test',
      definition: {
        name: 'Test App',
        pages: [
          {
            name: 'Test Page',
            blocks: [
              { type: '@test/a', version: '0.0.0' },
              { type: 'a', version: '0.1.0' },
              { type: 'a', version: '0.1.0' },
            ],
          },
          {
            name: 'Test Page with Flow',
            type: 'flow',
            steps: [
              {
                blocks: [
                  { type: 'a', version: '0.1.0' },
                  {
                    type: 'a',
                    version: '0.1.1',
                    actions: { whatever: { blocks: [{ type: '@test/b', version: '0.0.2' }] } },
                  },
                ],
              },
            ],
          },
        ],
      },
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
      msClarityID: '1234123123',
    });
    await AppMessages.bulkCreate([
      {
        AppId: app.id,
        language: 'en',
        messages: '{ greet: Hi! }',
      },
      {
        AppId: app.id,
        language: 'nl',
        messages: '{ greet: Hoi! }',
      },
    ]);

    const response = await request.get('/');

    const nonce = 'AAAAAAAAAAAAAAAAAAAAAA==';

    response.data.data = {
      ...response.data.data,
      nonce,
    };

    const csp = response.headers['content-security-policy'] as string;
    if (csp.includes('nonce-')) {
      const responseNonce = csp.slice(csp.indexOf('nonce-') + 6, csp.indexOf('nonce-') + 30);
      response.headers['content-security-policy'] = csp.replace(responseNonce, nonce);
    }

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Security-Policy: base-uri 'self'; connect-src * blob: data: https://clarity.ms https://www.clarity.ms; default-src 'self'; font-src * data:; frame-ancestors http://host.example; frame-src 'self' *.vimeo.com *.weseedo.nl *.youtube.com blob: http://host.example; img-src * blob: data: http://host.example https://clarity.ms https://www.clarity.ms; media-src * blob: data: http://host.example; object-src * blob: data: http://host.example; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clarity.ms https://scripts.clarity.ms https://www.clarity.ms; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; worker-src 'self' blob:
      Content-Type: text/html; charset=utf-8
      Referrer-Policy: strict-origin-when-cross-origin
      X-Appsemble-Messages-Cache: miss
      X-Appsemble-Settings-Cache: miss

      {
        "data": {
          "app": {
            "$created": "1970-01-01T00:00:00.000Z",
            "$updated": "1970-01-01T00:00:00.000Z",
            "OrganizationId": "test",
            "controllerCode": null,
            "controllerImplementations": null,
            "coreStyle": "",
            "definition": {
              "name": "Test App",
              "pages": [
                {
                  "blocks": [
                    {
                      "type": "@test/a",
                      "version": "0.0.0",
                    },
                    {
                      "type": "a",
                      "version": "0.1.0",
                    },
                    {
                      "type": "a",
                      "version": "0.1.0",
                    },
                  ],
                  "name": "Test Page",
                },
                {
                  "name": "Test Page with Flow",
                  "steps": [
                    {
                      "blocks": [
                        {
                          "type": "a",
                          "version": "0.1.0",
                        },
                        {
                          "actions": {
                            "whatever": {
                              "blocks": [
                                {
                                  "type": "@test/b",
                                  "version": "0.0.2",
                                },
                              ],
                            },
                          },
                          "type": "a",
                          "version": "0.1.1",
                        },
                      ],
                    },
                  ],
                  "type": "flow",
                },
              ],
            },
            "demoMode": false,
            "displayAppMemberName": false,
            "displayInstallationPrompt": false,
            "domain": null,
            "emailName": null,
            "enableSelfRegistration": true,
            "enableUnsecuredServiceSecrets": false,
            "googleAnalyticsID": null,
            "hasIcon": false,
            "hasMaskableIcon": false,
            "iconBackground": "#ffffff",
            "iconUrl": null,
            "id": 1,
            "locked": "unlocked",
            "metaPixelID": null,
            "msClarityID": "1234123123",
            "path": "app",
            "sentryDsn": null,
            "sentryEnvironment": null,
            "sharedStyle": "",
            "showAppDefinition": false,
            "showAppsembleLogin": false,
            "showAppsembleOAuth2Login": true,
            "skipGroupInvites": false,
            "supportedLanguages": null,
            "template": false,
            "totp": "disabled",
            "visibility": "unlisted",
            "yaml": "name: Test App
      pages:
        - name: Test Page
          blocks:
            - type: "@test/a"
              version: 0.0.0
            - type: a
              version: 0.1.0
            - type: a
              version: 0.1.0
        - name: Test Page with Flow
          type: flow
          steps:
            - blocks:
                - type: a
                  version: 0.1.0
                - type: a
                  version: 0.1.1
                  actions:
                    whatever:
                      blocks:
                        - type: "@test/b"
                          version: 0.0.2
      ",
          },
          "appUpdated": "1970-01-01T00:00:00.000Z",
          "appUrl": "http://app.test.host.example/",
          "bulmaURL": "/bulma/0.9.4/bulma.min.css?dangerColor=%23ff2800&fontFamily=Open+Sans&fontSource=google&infoColor=%23a7d0ff&linkColor=%230440ad&primaryColor=%235393ff&splashColor=%23ffffff&successColor=%231fd25b&themeColor=%23ffffff&tileLayer=https%3A%2F%2F%7Bs%7D.tile.openstreetmap.org%2F%7Bz%7D%2F%7Bx%7D%2F%7By%7D.png&warningColor=%23fed719",
          "faURL": "/fa/6.7.2/css/all.min.css",
          "host": "http://host.example",
          "locale": "en",
          "locales": [
            "nl",
          ],
          "noIndex": true,
          "nonce": "AAAAAAAAAAAAAAAAAAAAAA==",
          "settings": "<script>window.settings={"apiUrl":"http://host.example","appControllerCode":null,"appControllerImplementations":null,"blockManifests":[{"name":"@appsemble/a","version":"0.1.0","layout":null,"actions":null,"events":null,"files":["a0.css","a0.js"]},{"name":"@appsemble/a","version":"0.1.1","layout":null,"actions":null,"events":null,"files":["a1.css","a1.js"]},{"name":"@test/a","version":"0.0.0","layout":null,"actions":null,"events":null,"files":["a0.css","a0.js"]},{"name":"@test/b","version":"0.0.2","layout":null,"actions":null,"events":null,"files":["b2.css","b2.js"]}],"id":1,"languages":["en","nl"],"logins":[],"vapidPublicKey":"","definition":{"name":"Test App","pages":[{"name":"Test Page","blocks":[{"type":"@test/a","version":"0.0.0"},{"type":"a","version":"0.1.0"},{"type":"a","version":"0.1.0"}]},{"name":"Test Page with Flow","type":"flow","steps":[{"blocks":[{"type":"a","version":"0.1.0"},{"type":"a","version":"0.1.1","actions":{"whatever":{"blocks":[{"type":"@test/b","version":"0.0.2"}]}}}]}]}]},"demoMode":false,"showAppsembleLogin":false,"displayAppMemberName":false,"displayInstallationPrompt":false,"showAppsembleOAuth2Login":true,"enableSelfRegistration":true,"showDemoLogin":false,"totp":"disabled","appUpdated":"1970-01-01T00:00:00.000Z","supportedLanguages":["en"]};(function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "1234123123");</script>",
          "themeColor": "#ffffff",
        },
        "filename": "app/index.html",
      }
    `);
  });

  it('should render a stricter published app CSP when contentSecurityPolicy is configured', async () => {
    await App.create({
      OrganizationId: 'test',
      definition: {
        name: 'Test App',
        contentSecurityPolicy: {
          'connect-src': ['https://api.example.com'],
        },
        pages: [
          {
            name: 'Test Page',
            blocks: [],
          },
        ],
      },
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });

    const response = await request.get('/');
    const csp = parseCsp(response.headers['content-security-policy'] as string);

    expect(csp['connect-src']).toStrictEqual(
      expect.arrayContaining([
        "'self'",
        'blob:',
        'data:',
        'http://host.example',
        'https://api.example.com',
      ]),
    );
    expect(csp['connect-src']).not.toContain('*');
    expect(csp['font-src']).toStrictEqual(
      expect.arrayContaining(["'self'", 'data:', 'https://fonts.gstatic.com']),
    );
    expect(csp['font-src']).not.toContain('*');
    expect(csp['img-src']).toStrictEqual(
      expect.arrayContaining(["'self'", 'blob:', 'data:', 'http://host.example']),
    );
    expect(csp['img-src']).not.toContain('*');
    expect(csp['media-src']).toStrictEqual(
      expect.arrayContaining(["'self'", 'blob:', 'data:', 'http://host.example']),
    );
    expect(csp['media-src']).not.toContain('*');
    expect(csp['object-src']).toStrictEqual(["'none'"]);
  });

  it('should render a 404 page if no app is found', async () => {
    const response = await request.get('/');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: text/html; charset=utf-8
      Referrer-Policy: strict-origin-when-cross-origin

      {
        "data": {
          "bulmaURL": "/bulma/0.9.4/bulma.min.css",
          "faURL": "/fa/6.7.2/css/all.min.css",
          "message": "The app you are looking for could not be found.",
        },
        "filename": "app/error.html",
      }
    `);
  });

  it('should redirect if only the organization id is given', async () => {
    requestURL = new URL('http://org.host.example');
    const response = await request.get('/');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 302 Found
      Content-Type: text/html; charset=utf-8
      Location: http://host.example/organizations/org
      Referrer-Policy: strict-origin-when-cross-origin

      Redirecting to http://host.example/organizations/org.
    `);
  });

  it('should if the app has a custom domain', async () => {
    requestURL = new URL('http://app.test.host.example');
    await App.create({
      OrganizationId: 'test',
      definition: {
        name: 'Test App',
        pages: [],
      },
      path: 'app',
      domain: 'custom.example',
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });
    const response = await request.get('/en?query=param');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 302 Found
      Content-Type: text/html; charset=utf-8
      Location: http://custom.example/en?query=param
      Referrer-Policy: strict-origin-when-cross-origin

      Redirecting to http://custom.example/en?query=param.
    `);
  });

  it('should redirect to the app root if the organization id is disallowed', async () => {
    requestURL = new URL('http://www.host.example');
    const response = await request.get('/');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 302 Found
      Content-Type: text/html; charset=utf-8
      Location: http://host.example/
      Referrer-Policy: strict-origin-when-cross-origin

      Redirecting to http://host.example/.
    `);
  });

  it('should not return meta noindex if app is public', async () => {
    await App.create({
      OrganizationId: 'test',
      definition: {},
      visibility: 'public',
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });

    const response = await request.get('/');

    expect(response.data).toMatchObject({
      data: {
        noIndex: false,
      },
      filename: 'app/index.html',
    });
  });

  it('should return meta noindex if app is private', async () => {
    await App.create({
      OrganizationId: 'test',
      definition: {},
      visibility: 'private',
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });

    const response = await request.get('/');

    expect(response.data).toMatchObject({
      data: {
        noIndex: true,
      },
      filename: 'app/index.html',
    });
  });

  it('should return meta noindex if app is unlisted', async () => {
    await App.create({
      OrganizationId: 'test',
      definition: {},
      visibility: 'unlisted',
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });

    const response = await request.get('/');

    expect(response.data).toMatchObject({
      data: {
        noIndex: true,
      },
      filename: 'app/index.html',
    });
  });

  it('should use the snapshot manifest for settings', async () => {
    const app = await App.create({
      OrganizationId: 'test',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        pages: [{ name: 'Test Page', blocks: [{ type: '@test/a', version: '0.0.0' }] }],
      },
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });

    const snapshot = await AppSnapshot.create({
      AppId: app.id,
      yaml: 'name: Test App\ndefaultPage: Test Page\npages: []\n',
    });
    await AppBuildSnapshot.create({
      AppSnapshotId: snapshot.id,
      buildManifestJson: {
        version: 1,
        blockManifests: [
          {
            actions: null,
            events: null,
            files: ['a0.css', 'a0.js'],
            layout: null,
            name: '@test/a',
            version: '0.0.0',
          },
        ],
      },
    });

    await BlockAsset.destroy({ where: {} });
    await BlockVersion.destroy({ where: {} });

    requestURL = new URL('http://app.test.host.example/en/test-page');

    const response = await request.get('/en/test-page');

    expect(response.data).toMatchObject({
      filename: 'app/index.html',
    });
    expect(response.data.data.settings).toContain('"blockManifests":[');
    expect(response.data.data.settings).toContain('"name":"@test/a"');
    expect(response.data.data.settings).toContain('"files":["a0.css","a0.js"]');
  });

  it('should lazily create a build manifest when the latest snapshot has no build manifest', async () => {
    const app = await App.create({
      OrganizationId: 'test',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        pages: [{ name: 'Test Page', blocks: [{ type: '@test/a', version: '0.0.0' }] }],
      },
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });

    const snapshot = await AppSnapshot.create({
      AppId: app.id,
      yaml: `
        name: Test App
        defaultPage: Test Page
        pages:
          - name: Test Page
            blocks:
              - type: '@test/a'
                version: 0.0.0
      `,
    });

    requestURL = new URL('http://app.test.host.example/en/test-page');

    const response = await request.get('/en/test-page');

    expect(response.data).toMatchObject({
      filename: 'app/index.html',
    });
    expect(response.data.data.settings).toContain('"blockManifests":[');
    expect(response.data.data.settings).toContain('"name":"@test/a"');
    expect(response.data.data.settings).toContain('"files":["a0.css","a0.js"]');

    expect(await AppBuildSnapshot.findByPk(snapshot.id)).toStrictEqual(
      expect.objectContaining({
        AppSnapshotId: snapshot.id,
        buildManifestJson: {
          version: 1,
          blockManifests: [
            {
              actions: null,
              events: null,
              files: ['a0.css', 'a0.js'],
              layout: null,
              name: '@test/a',
              version: '0.0.0',
            },
          ],
        },
      }),
    );

    await request.get('/en/test-page');

    expect(await AppBuildSnapshot.count({ where: { AppSnapshotId: snapshot.id } })).toBe(1);
  });

  it('should lazily prune older build manifests after creating the latest build manifest', async () => {
    const app = await App.create({
      OrganizationId: 'test',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        pages: [{ name: 'Test Page', blocks: [{ type: '@test/a', version: '0.0.0' }] }],
      },
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });

    const oldSnapshot = await AppSnapshot.create({
      AppId: app.id,
      yaml: 'name: Old App\npages: []\n',
    });
    await AppBuildSnapshot.create({
      AppSnapshotId: oldSnapshot.id,
      buildManifestJson: { version: 1, blockManifests: [] },
    });
    const latestSnapshot = await AppSnapshot.create({
      AppId: app.id,
      yaml: `
        name: Test App
        defaultPage: Test Page
        pages:
          - name: Test Page
            blocks:
              - type: '@test/a'
                version: 0.0.0
      `,
    });

    requestURL = new URL('http://app.test.host.example/en/test-page');

    const response = await request.get('/en/test-page');

    expect(response.data).toMatchObject({
      filename: 'app/index.html',
    });
    expect(await AppSnapshot.count({ where: { AppId: app.id } })).toBe(2);
    expect(await AppBuildSnapshot.findAll({ order: [['AppSnapshotId', 'ASC']] })).toStrictEqual([
      expect.objectContaining({
        AppSnapshotId: latestSnapshot.id,
      }),
    ]);
  });

  it('should fall back without writing a build manifest when block metadata is incomplete', async () => {
    const app = await App.create({
      OrganizationId: 'test',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        pages: [{ name: 'Test Page', blocks: [{ type: '@test/missing', version: '0.0.0' }] }],
      },
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });

    const snapshot = await AppSnapshot.create({
      AppId: app.id,
      yaml: `
        name: Test App
        defaultPage: Test Page
        pages:
          - name: Test Page
            blocks:
              - type: '@test/missing'
                version: 0.0.0
      `,
    });

    requestURL = new URL('http://app.test.host.example/en/test-page');

    const response = await request.get('/en/test-page');

    expect(response.data).toMatchObject({
      filename: 'app/index.html',
    });
    expect(response.data.data.settings).toContain('"blockManifests":[]');
    expect(await AppBuildSnapshot.findByPk(snapshot.id)).toBeNull();
  });

  it('should fall back without writing a build manifest when the latest snapshot yaml is invalid', async () => {
    const app = await App.create({
      OrganizationId: 'test',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        pages: [{ name: 'Test Page', blocks: [{ type: '@test/a', version: '0.0.0' }] }],
      },
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });

    const snapshot = await AppSnapshot.create({
      AppId: app.id,
      yaml: 'name: Test App\npages:\n  - name: Test Page\n    blocks: [',
    });

    requestURL = new URL('http://app.test.host.example/en/test-page');

    const response = await request.get('/en/test-page');

    expect(response.data).toMatchObject({
      filename: 'app/index.html',
    });
    expect(response.data.data.settings).toContain('"blockManifests":[');
    expect(response.data.data.settings).toContain('"name":"@test/a"');
    expect(await AppBuildSnapshot.findByPk(snapshot.id)).toBeNull();
  });

  it('should keep the derived build manifest when persisting it fails', async () => {
    const app = await App.create({
      OrganizationId: 'test',
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        pages: [{ name: 'Test Page', blocks: [{ type: '@test/missing', version: '0.0.0' }] }],
      },
      path: 'app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });

    const snapshot = await AppSnapshot.create({
      AppId: app.id,
      yaml: `
        name: Test App
        defaultPage: Test Page
        pages:
          - name: Test Page
            blocks:
              - type: '@test/a'
                version: 0.0.0
      `,
    });
    const persistenceError = new Error('persist failed');
    const findOrCreateSpy = vi
      .spyOn(AppBuildSnapshot, 'findOrCreate')
      .mockRejectedValue(persistenceError);
    const loggerWarnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => logger);
    const loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);

    requestURL = new URL('http://app.test.host.example/en/test-page');

    const response = await request.get('/en/test-page');

    expect(response.data).toMatchObject({
      filename: 'app/index.html',
    });
    expect(response.data.data.settings).toContain('"blockManifests":[');
    expect(response.data.data.settings).toContain('"name":"@test/a"');
    expect(response.data.data.settings).not.toContain('"blockManifests":[]');
    expect(findOrCreateSpy).toHaveBeenCalledOnce();
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      `Failed to persist a build manifest for app snapshot ${snapshot.id}.`,
    );
    expect(loggerErrorSpy).toHaveBeenCalledWith(persistenceError);
    expect(await AppBuildSnapshot.findByPk(snapshot.id)).toBeNull();
  });
});

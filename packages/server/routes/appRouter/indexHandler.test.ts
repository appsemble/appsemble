// eslint-disable-next-line unicorn/import-style
import crypto from 'node:crypto';

import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, AppMessages, BlockAsset, BlockVersion, Organization } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';
import { createServer } from '../../utils/createServer.js';

let requestURL: URL;

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
    const server = await createServer({
      middleware(ctx, next) {
        Object.defineProperty(ctx, 'origin', { get: () => requestURL.origin });
        Object.defineProperty(ctx, 'hostname', { get: () => requestURL.hostname });
        return next();
      },
    });
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

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Security-Policy: base-uri 'self'; connect-src * blob: data:; default-src 'self'; font-src * data:; frame-ancestors http://host.example; frame-src 'self' *.vimeo.com *.weseedo.nl *.youtube.com blob: http://host.example; img-src * blob: data: http://host.example; media-src * blob: data: http://host.example; object-src * blob: data: http://host.example; script-src 'nonce-AAAAAAAAAAAAAAAAAAAAAA==' 'self' 'sha256-NnfhkfyMQqbhX/LkO/wZjQ0LpRQSoaJOTdj57aWuNR8=' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
      Content-Type: text/html; charset=utf-8
      Referrer-Policy: strict-origin-when-cross-origin
      X-Content-Type-Options: nosniff

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
          "bulmaURL": "/bulma/0.9.3/bulma.min.css?dangerColor=%23ff2800&fontFamily=Open+Sans&fontSource=google&infoColor=%23a7d0ff&linkColor=%230440ad&primaryColor=%235393ff&splashColor=%23ffffff&successColor=%231fd25b&themeColor=%23ffffff&tileLayer=https%3A%2F%2F%7Bs%7D.tile.openstreetmap.org%2F%7Bz%7D%2F%7Bx%7D%2F%7By%7D.png&warningColor=%23fed719",
          "faURL": "/fa/6.7.2/css/all.min.css",
          "host": "http://host.example",
          "locale": "en",
          "locales": [
            "nl",
          ],
          "noIndex": true,
          "nonce": "AAAAAAAAAAAAAAAAAAAAAA==",
          "settings": "<script>window.settings={"apiUrl":"http://host.example","appControllerCode":null,"appControllerImplementations":null,"blockManifests":[{"name":"@test/a","version":"0.0.0","layout":null,"actions":null,"events":null,"files":["a0.js","a0.css"]},{"name":"@test/b","version":"0.0.2","layout":null,"actions":null,"events":null,"files":["b2.js","b2.css"]},{"name":"@appsemble/a","version":"0.1.0","layout":null,"actions":null,"events":null,"files":["a0.js","a0.css"]},{"name":"@appsemble/a","version":"0.1.1","layout":null,"actions":null,"events":null,"files":["a1.js","a1.css"]}],"id":1,"languages":["en","nl"],"logins":[],"vapidPublicKey":"","definition":{"name":"Test App","pages":[{"name":"Test Page","blocks":[{"type":"@test/a","version":"0.0.0"},{"type":"a","version":"0.1.0"},{"type":"a","version":"0.1.0"}]},{"name":"Test Page with Flow","type":"flow","steps":[{"blocks":[{"type":"a","version":"0.1.0"},{"type":"a","version":"0.1.1","actions":{"whatever":{"blocks":[{"type":"@test/b","version":"0.0.2"}]}}}]}]}]},"demoMode":false,"showAppsembleLogin":false,"displayAppMemberName":false,"displayInstallationPrompt":false,"showAppsembleOAuth2Login":true,"enableSelfRegistration":true,"showDemoLogin":false,"appUpdated":"1970-01-01T00:00:00.000Z","supportedLanguages":["en"]}</script>",
          "themeColor": "#ffffff",
        },
        "filename": "app/index.html",
      }
    `);
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

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Security-Policy: base-uri 'self'; connect-src * blob: data: https://clarity.ms https://www.clarity.ms; default-src 'self'; font-src * data:; frame-ancestors http://host.example; frame-src 'self' *.vimeo.com *.weseedo.nl *.youtube.com blob: http://host.example; img-src * blob: data: http://host.example https://clarity.ms https://www.clarity.ms; media-src * blob: data: http://host.example; object-src * blob: data: http://host.example; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clarity.ms https://scripts.clarity.ms https://www.clarity.ms; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
      Content-Type: text/html; charset=utf-8
      Referrer-Policy: strict-origin-when-cross-origin
      X-Content-Type-Options: nosniff

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
          "bulmaURL": "/bulma/0.9.3/bulma.min.css?dangerColor=%23ff2800&fontFamily=Open+Sans&fontSource=google&infoColor=%23a7d0ff&linkColor=%230440ad&primaryColor=%235393ff&splashColor=%23ffffff&successColor=%231fd25b&themeColor=%23ffffff&tileLayer=https%3A%2F%2F%7Bs%7D.tile.openstreetmap.org%2F%7Bz%7D%2F%7Bx%7D%2F%7By%7D.png&warningColor=%23fed719",
          "faURL": "/fa/6.7.2/css/all.min.css",
          "host": "http://host.example",
          "locale": "en",
          "locales": [
            "nl",
          ],
          "noIndex": true,
          "nonce": "AAAAAAAAAAAAAAAAAAAAAA==",
          "settings": "<script>window.settings={"apiUrl":"http://host.example","appControllerCode":null,"appControllerImplementations":null,"blockManifests":[{"name":"@test/a","version":"0.0.0","layout":null,"actions":null,"events":null,"files":["a0.js","a0.css"]},{"name":"@test/b","version":"0.0.2","layout":null,"actions":null,"events":null,"files":["b2.js","b2.css"]},{"name":"@appsemble/a","version":"0.1.0","layout":null,"actions":null,"events":null,"files":["a0.js","a0.css"]},{"name":"@appsemble/a","version":"0.1.1","layout":null,"actions":null,"events":null,"files":["a1.js","a1.css"]}],"id":1,"languages":["en","nl"],"logins":[],"vapidPublicKey":"","definition":{"name":"Test App","pages":[{"name":"Test Page","blocks":[{"type":"@test/a","version":"0.0.0"},{"type":"a","version":"0.1.0"},{"type":"a","version":"0.1.0"}]},{"name":"Test Page with Flow","type":"flow","steps":[{"blocks":[{"type":"a","version":"0.1.0"},{"type":"a","version":"0.1.1","actions":{"whatever":{"blocks":[{"type":"@test/b","version":"0.0.2"}]}}}]}]}]},"demoMode":false,"showAppsembleLogin":false,"displayAppMemberName":false,"displayInstallationPrompt":false,"showAppsembleOAuth2Login":true,"enableSelfRegistration":true,"showDemoLogin":false,"appUpdated":"1970-01-01T00:00:00.000Z","supportedLanguages":["en"]};(function(c,l,a,r,i,t,y){
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

  it('should render a 404 page if no app is found', async () => {
    const response = await request.get('/');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: text/html; charset=utf-8
      Referrer-Policy: strict-origin-when-cross-origin
      X-Content-Type-Options: nosniff

      {
        "data": {
          "bulmaURL": "/bulma/0.9.3/bulma.min.css",
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
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 302 Found
      Content-Type: text/html; charset=utf-8
      Location: http://host.example/organizations/org
      Referrer-Policy: strict-origin-when-cross-origin
      X-Content-Type-Options: nosniff

      Redirecting to <a href="http://host.example/organizations/org">http://host.example/organizations/org</a>.
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
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 302 Found
      Content-Type: text/html; charset=utf-8
      Location: http://custom.example/en?query=param
      Referrer-Policy: strict-origin-when-cross-origin
      X-Content-Type-Options: nosniff

      Redirecting to <a href="http://custom.example/en?query=param">http://custom.example/en?query=param</a>.
    `);
  });

  it('should redirect to the app root if the organization id is disallowed', async () => {
    requestURL = new URL('http://www.host.example');
    const response = await request.get('/');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 302 Found
      Content-Type: text/html; charset=utf-8
      Location: http://host.example/
      Referrer-Policy: strict-origin-when-cross-origin
      X-Content-Type-Options: nosniff

      Redirecting to <a href="http://host.example/">http://host.example/</a>.
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
});

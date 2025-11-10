import { getRandomValues } from 'node:crypto';

import { createFixtureStream, createFormData } from '@appsemble/node-utils';
import {
  type App as AppType,
  PredefinedOrganizationRole,
  SubscriptionPlanType,
} from '@appsemble/types';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import stripIndent from 'strip-indent';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppScreenshot,
  BlockAsset,
  BlockMessages,
  BlockVersion,
  getAppDB,
  Organization,
  OrganizationMember,
  OrganizationSubscription,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { decrypt } from '../../../utils/crypto.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';
import { createTestDBWithUser } from '../../../utils/test/testSchema.js';

let organization: Organization;
let user: User;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('createApp', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv(argv);
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    await Organization.create({ id: 'appsemble', name: 'Appsemble' });

    await BlockVersion.create({
      name: 'test',
      OrganizationId: 'appsemble',
      version: '0.0.0',
      parameters: {
        type: 'object',
        properties: {
          foo: {
            type: 'number',
          },
        },
      },
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should create an app', async () => {
    authorizeStudio();
    const createdResponse = await request.post<AppType>(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        icon: createFixtureStream('nodejs-logo.png'),
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
      }),
    );

    expect(createdResponse).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
          "pages": [
            {
              "blocks": [
                {
                  "type": "test",
                  "version": "0.0.0",
                },
              ],
              "name": "Test Page",
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
        "hasIcon": true,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": "/api/apps/1/icon?maskable=true&updated=1970-01-01T00%3A00%3A00.000Z",
        "id": 1,
        "locked": "unlocked",
        "metaPixelID": null,
        "msClarityID": null,
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "skipGroupInvites": false,
        "supportedLanguages": [
          "en",
        ],
        "template": false,
        "version": 1,
        "visibility": "unlisted",
        "yaml": "
      name: Test App
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
              ",
      }
    `);
    const { data: retrieved } = await request.get(`/api/apps/${createdResponse.data.id}`);
    expect(retrieved).toStrictEqual(createdResponse.data);
  });

  it('should create an app with supportedLanguages', async () => {
    authorizeStudio();
    const response = await request.post<AppType>(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        icon: createFixtureStream('nodejs-logo.png'),
        supportedLanguages: ['en', 'nl'],
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
      }),
    );
    expect(response.status).toBe(201);
    expect(response.data.supportedLanguages).toStrictEqual(['en', 'nl']);
  });

  it('should create an app member with role `cron` if the security definition has cron defined', async () => {
    authorizeStudio();
    const response = await request.post<AppType>(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        icon: createFixtureStream('nodejs-logo.png'),
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          cron:
            testCron:
              schedule : '*/5 * * * *'
              action:
                type: noop
          security:
            cron:
              permissions: []
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
      }),
    );
    expect(response.status).toBe(201);
    const { AppMember } = await getAppDB(response.data.id!);
    const foundMember = (await AppMember.findOne({
      where: { role: 'cron' },
    }))!;
    expect(foundMember.dataValues).toMatchObject({
      email: expect.stringMatching('cron.*example'),
      role: 'cron',
    });
  });

  it('should return an error if generated path is longer than 30 characters', async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(30);
    getRandomValues(array);
    const randomName = String.fromCharCode(...array.map((n) => chars.charCodeAt(n % chars.length)));
    await App.create(
      {
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
        },
        path: randomName,
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );
    authorizeStudio();
    const createdResponse = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        yaml: stripIndent(`
          name: ${randomName}
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
        icon: createFixtureStream('nodejs-logo.png'),
      }),
    );
    expect(createdResponse).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Invalid path for app, please update the name of your app.",
        "statusCode": 400,
      }

    `);
  });

  it('should accept screenshots', async () => {
    authorizeStudio();
    const createdResponse = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
        icon: createFixtureStream('nodejs-logo.png'),
        screenshots: createFixtureStream('standing.png'),
      }),
    );

    expect(createdResponse).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
          "pages": [
            {
              "blocks": [
                {
                  "type": "test",
                  "version": "0.0.0",
                },
              ],
              "name": "Test Page",
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
        "hasIcon": true,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": "/api/apps/1/icon?maskable=true&updated=1970-01-01T00%3A00%3A00.000Z",
        "id": 1,
        "locked": "unlocked",
        "metaPixelID": null,
        "msClarityID": null,
        "path": "test-app",
        "screenshotUrls": [
          "/api/apps/1/screenshots/1",
        ],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "skipGroupInvites": false,
        "supportedLanguages": [
          "en",
        ],
        "template": false,
        "version": 1,
        "visibility": "unlisted",
        "yaml": "
      name: Test App
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
              ",
      }
    `);

    const screenshot = (await AppScreenshot.findOne())!;
    expect(screenshot.toJSON()).toStrictEqual({
      AppId: 1,
      created: new Date(),
      height: 247,
      id: 1,
      index: 0,
      language: 'unspecified',
      mime: 'image/png',
      screenshot: expect.any(Buffer),
      updated: new Date(),
      width: 474,
    });
  });

  it('should accept screenshots by language and order them', async () => {
    authorizeStudio();
    const createdApp = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
        icon: createFixtureStream('nodejs-logo.png'),
        screenshots: [
          createFixtureStream('standing.png'),
          createFixtureStream('standing.png'),
          createFixtureStream('en-standing.png'),
          createFixtureStream('en-standing.png'),
          createFixtureStream('nl-standing.png'),
          createFixtureStream('nl-standing.png'),
        ],
      }),
    );

    const unspecifiedScreenshots = await AppScreenshot.findAll({
      where: {
        language: 'unspecified',
      },
    });

    expect(unspecifiedScreenshots[0].toJSON()).toStrictEqual({
      AppId: 1,
      created: new Date(),
      height: 247,
      id: 1,
      index: 0,
      language: 'unspecified',
      mime: 'image/png',
      screenshot: expect.any(Buffer),
      updated: new Date(),
      width: 474,
    });

    expect(unspecifiedScreenshots[1].toJSON()).toStrictEqual({
      AppId: 1,
      created: new Date(),
      height: 247,
      id: 2,
      index: 1,
      language: 'unspecified',
      mime: 'image/png',
      screenshot: expect.any(Buffer),
      updated: new Date(),
      width: 474,
    });

    const enScreenshots = await AppScreenshot.findAll({
      where: {
        language: 'en',
      },
    });

    expect(enScreenshots[0].toJSON()).toStrictEqual({
      AppId: 1,
      created: new Date(),
      height: 247,
      id: 3,
      index: 0,
      language: 'en',
      mime: 'image/png',
      screenshot: expect.any(Buffer),
      updated: new Date(),
      width: 474,
    });

    expect(enScreenshots[1].toJSON()).toStrictEqual({
      AppId: 1,
      created: new Date(),
      height: 247,
      id: 4,
      index: 1,
      language: 'en',
      mime: 'image/png',
      screenshot: expect.any(Buffer),
      updated: new Date(),
      width: 474,
    });

    const nlScreenshots = await AppScreenshot.findAll({
      where: {
        language: 'nl',
      },
    });

    expect(nlScreenshots[0].toJSON()).toStrictEqual({
      AppId: 1,
      created: new Date(),
      height: 247,
      id: 5,
      index: 0,
      language: 'nl',
      mime: 'image/png',
      screenshot: expect.any(Buffer),
      updated: new Date(),
      width: 474,
    });

    expect(nlScreenshots[1].toJSON()).toStrictEqual({
      AppId: 1,
      created: new Date(),
      height: 247,
      id: 6,
      index: 1,
      language: 'nl',
      mime: 'image/png',
      screenshot: expect.any(Buffer),
      updated: new Date(),
      width: 474,
    });

    const unspecifiedApp = await request.get(`/api/apps/${createdApp.data.id}`);

    expect(unspecifiedApp).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
          "pages": [
            {
              "blocks": [
                {
                  "type": "test",
                  "version": "0.0.0",
                },
              ],
              "name": "Test Page",
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
        "hasIcon": true,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": "/api/apps/1/icon?maskable=true&updated=1970-01-01T00%3A00%3A00.000Z",
        "id": 1,
        "locked": "unlocked",
        "metaPixelID": null,
        "msClarityID": null,
        "path": "test-app",
        "screenshotUrls": [
          "/api/apps/1/screenshots/1",
          "/api/apps/1/screenshots/2",
        ],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "skipGroupInvites": false,
        "supportedLanguages": [
          "en",
        ],
        "template": false,
        "version": 1,
        "visibility": "unlisted",
        "yaml": "
      name: Test App
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
              ",
      }
    `);

    const frApp = await request.get(`/api/apps/${createdApp.data.id}`);

    expect(frApp).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
          "pages": [
            {
              "blocks": [
                {
                  "type": "test",
                  "version": "0.0.0",
                },
              ],
              "name": "Test Page",
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
        "hasIcon": true,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": "/api/apps/1/icon?maskable=true&updated=1970-01-01T00%3A00%3A00.000Z",
        "id": 1,
        "locked": "unlocked",
        "metaPixelID": null,
        "msClarityID": null,
        "path": "test-app",
        "screenshotUrls": [
          "/api/apps/1/screenshots/1",
          "/api/apps/1/screenshots/2",
        ],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "skipGroupInvites": false,
        "supportedLanguages": [
          "en",
        ],
        "template": false,
        "version": 1,
        "visibility": "unlisted",
        "yaml": "
      name: Test App
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
              ",
      }
    `);

    const enApp = await request.get(`/api/apps/${createdApp.data.id}?language=en`);

    expect(enApp).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
          "pages": [
            {
              "blocks": [
                {
                  "type": "test",
                  "version": "0.0.0",
                },
              ],
              "name": "Test Page",
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
        "hasIcon": true,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": "/api/apps/1/icon?maskable=true&updated=1970-01-01T00%3A00%3A00.000Z",
        "id": 1,
        "locked": "unlocked",
        "metaPixelID": null,
        "msClarityID": null,
        "path": "test-app",
        "screenshotUrls": [
          "/api/apps/1/screenshots/3",
          "/api/apps/1/screenshots/4",
        ],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "skipGroupInvites": false,
        "supportedLanguages": [
          "en",
        ],
        "template": false,
        "version": 1,
        "visibility": "unlisted",
        "yaml": "
      name: Test App
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
              ",
      }
    `);

    const nlApp = await request.get(`/api/apps/${createdApp.data.id}?language=nl`);

    expect(nlApp).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
          "pages": [
            {
              "blocks": [
                {
                  "type": "test",
                  "version": "0.0.0",
                },
              ],
              "name": "Test Page",
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
        "hasIcon": true,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": "/api/apps/1/icon?maskable=true&updated=1970-01-01T00%3A00%3A00.000Z",
        "id": 1,
        "locked": "unlocked",
        "metaPixelID": null,
        "msClarityID": null,
        "path": "test-app",
        "screenshotUrls": [
          "/api/apps/1/screenshots/5",
          "/api/apps/1/screenshots/6",
        ],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "skipGroupInvites": false,
        "supportedLanguages": [
          "en",
        ],
        "template": false,
        "version": 1,
        "visibility": "unlisted",
        "yaml": "
      name: Test App
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
              ",
      }
    `);

    await AppScreenshot.destroy({
      where: {
        language: 'unspecified',
      },
    });

    const frApp2 = await request.get(`/api/apps/${createdApp.data.id}`);

    expect(frApp2).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
          "pages": [
            {
              "blocks": [
                {
                  "type": "test",
                  "version": "0.0.0",
                },
              ],
              "name": "Test Page",
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
        "hasIcon": true,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": "/api/apps/1/icon?maskable=true&updated=1970-01-01T00%3A00%3A00.000Z",
        "id": 1,
        "locked": "unlocked",
        "metaPixelID": null,
        "msClarityID": null,
        "path": "test-app",
        "screenshotUrls": [
          "/api/apps/1/screenshots/3",
          "/api/apps/1/screenshots/4",
        ],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "skipGroupInvites": false,
        "supportedLanguages": [
          "en",
        ],
        "template": false,
        "version": 1,
        "visibility": "unlisted",
        "yaml": "
      name: Test App
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
              ",
      }
    `);
  });

  it('should accept controller', async () => {
    authorizeStudio();

    const createdResponse = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
        icon: createFixtureStream('nodejs-logo.png'),
        controllerCode:
          '(()=>{function a(t){let n=new CustomEvent("AppsembleController",{detail:{fn:t,document}});document.currentScript&&document.currentScript.dispatchEvent(n)}a(({events:t})=>({calculate(n){let{a:o,b:r,operation:s}=n,e;switch(s){case"addition":e=o+r;break;case"multiplication":e=o*r;break;default:e=Number.NaN;break}t.emit.data({result:e})}}));})();',
        controllerImplementations:
          '{"description":"A controller for the controller-demo app.","events":{"emit":{"data":{"description":"Event that gets emitted when the calculation result is available."}}},"name":"@appsemble/controller-demo","version":"0.22.10","files":["index.js","index.js.map"]}',
      }),
    );

    expect(createdResponse).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": "(()=>{function a(t){let n=new CustomEvent("AppsembleController",{detail:{fn:t,document}});document.currentScript&&document.currentScript.dispatchEvent(n)}a(({events:t})=>({calculate(n){let{a:o,b:r,operation:s}=n,e;switch(s){case"addition":e=o+r;break;case"multiplication":e=o*r;break;default:e=Number.NaN;break}t.emit.data({result:e})}}));})();",
        "controllerImplementations": "{"description":"A controller for the controller-demo app.","events":{"emit":{"data":{"description":"Event that gets emitted when the calculation result is available."}}},"name":"@appsemble/controller-demo","version":"0.22.10","files":["index.js","index.js.map"]}",
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
          "pages": [
            {
              "blocks": [
                {
                  "type": "test",
                  "version": "0.0.0",
                },
              ],
              "name": "Test Page",
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
        "hasIcon": true,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": "/api/apps/1/icon?maskable=true&updated=1970-01-01T00%3A00%3A00.000Z",
        "id": 1,
        "locked": "unlocked",
        "metaPixelID": null,
        "msClarityID": null,
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "skipGroupInvites": false,
        "supportedLanguages": [
          "en",
        ],
        "template": false,
        "version": 1,
        "visibility": "unlisted",
        "yaml": "
      name: Test App
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
              ",
      }
    `);
  });

  it('should not allow an upload without an app when creating an app', async () => {
    authorizeStudio();
    const response = await request.post(
      '/api/apps',
      createFormData({ coreStyle: 'body { color: red; }' }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": "OrganizationId",
            "instance": {
              "coreStyle": "body { color: red; }",
            },
            "message": "requires property "OrganizationId"",
            "name": "required",
            "path": [],
            "property": "instance",
            "schema": {
              "properties": {
                "OrganizationId": {
                  "$ref": "#/components/schemas/Organization/properties/id",
                },
                "controllerCode": {
                  "description": "Custom app logic as a JavaScript string",
                  "type": "string",
                },
                "controllerImplementations": {
                  "description": "Appsemble SDK interfaces implementations",
                  "type": "string",
                },
                "coreStyle": {
                  "description": "The custom style to apply to the core app.",
                  "type": "string",
                },
                "demoMode": {
                  "$ref": "#/components/schemas/App/properties/demoMode",
                },
                "domain": {
                  "$ref": "#/components/schemas/App/properties/domain",
                },
                "icon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "iconBackground": {
                  "description": "The background color to use for the maskable icon.",
                  "pattern": "^#[\\dA-Fa-f]{6}$",
                  "type": "string",
                },
                "maskableIcon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "path": {
                  "$ref": "#/components/schemas/App/properties/path",
                },
                "readmes": {
                  "description": "Readmes to showcase in the store",
                  "items": {
                    "format": "binary",
                    "type": "string",
                  },
                  "type": "array",
                },
                "screenshots": {
                  "description": "Screenshots to showcase in the store",
                  "items": {
                    "format": "binary",
                    "type": "string",
                  },
                  "type": "array",
                },
                "sharedStyle": {
                  "description": "The custom style to apply to all parts of app.",
                  "type": "string",
                },
                "supportedLanguages": {
                  "$ref": "#/components/schemas/App/properties/supportedLanguages",
                },
                "template": {
                  "$ref": "#/components/schemas/App/properties/template",
                },
                "visibility": {
                  "$ref": "#/components/schemas/App/properties/visibility",
                },
                "yaml": {
                  "description": "The original YAML definition used to define the app.",
                  "type": "string",
                },
              },
              "required": [
                "OrganizationId",
                "yaml",
              ],
              "type": "object",
            },
            "stack": "instance requires property "OrganizationId"",
          },
          {
            "argument": "yaml",
            "instance": {
              "coreStyle": "body { color: red; }",
            },
            "message": "requires property "yaml"",
            "name": "required",
            "path": [],
            "property": "instance",
            "schema": {
              "properties": {
                "OrganizationId": {
                  "$ref": "#/components/schemas/Organization/properties/id",
                },
                "controllerCode": {
                  "description": "Custom app logic as a JavaScript string",
                  "type": "string",
                },
                "controllerImplementations": {
                  "description": "Appsemble SDK interfaces implementations",
                  "type": "string",
                },
                "coreStyle": {
                  "description": "The custom style to apply to the core app.",
                  "type": "string",
                },
                "demoMode": {
                  "$ref": "#/components/schemas/App/properties/demoMode",
                },
                "domain": {
                  "$ref": "#/components/schemas/App/properties/domain",
                },
                "icon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "iconBackground": {
                  "description": "The background color to use for the maskable icon.",
                  "pattern": "^#[\\dA-Fa-f]{6}$",
                  "type": "string",
                },
                "maskableIcon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "path": {
                  "$ref": "#/components/schemas/App/properties/path",
                },
                "readmes": {
                  "description": "Readmes to showcase in the store",
                  "items": {
                    "format": "binary",
                    "type": "string",
                  },
                  "type": "array",
                },
                "screenshots": {
                  "description": "Screenshots to showcase in the store",
                  "items": {
                    "format": "binary",
                    "type": "string",
                  },
                  "type": "array",
                },
                "sharedStyle": {
                  "description": "The custom style to apply to all parts of app.",
                  "type": "string",
                },
                "supportedLanguages": {
                  "$ref": "#/components/schemas/App/properties/supportedLanguages",
                },
                "template": {
                  "$ref": "#/components/schemas/App/properties/template",
                },
                "visibility": {
                  "$ref": "#/components/schemas/App/properties/visibility",
                },
                "yaml": {
                  "description": "The original YAML definition used to define the app.",
                  "type": "string",
                },
              },
              "required": [
                "OrganizationId",
                "yaml",
              ],
              "type": "object",
            },
            "stack": "instance requires property "yaml"",
          },
        ],
        "message": "Invalid content types found",
      }
    `);
  });

  it('should not allow apps to be created without an organization.id', async () => {
    authorizeStudio();
    const response = await request.post(
      '/api/apps',
      createFormData({
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.1
        `).trim(),
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": "OrganizationId",
            "instance": {
              "yaml": "name: Test App
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.1",
            },
            "message": "requires property "OrganizationId"",
            "name": "required",
            "path": [],
            "property": "instance",
            "schema": {
              "properties": {
                "OrganizationId": {
                  "$ref": "#/components/schemas/Organization/properties/id",
                },
                "controllerCode": {
                  "description": "Custom app logic as a JavaScript string",
                  "type": "string",
                },
                "controllerImplementations": {
                  "description": "Appsemble SDK interfaces implementations",
                  "type": "string",
                },
                "coreStyle": {
                  "description": "The custom style to apply to the core app.",
                  "type": "string",
                },
                "demoMode": {
                  "$ref": "#/components/schemas/App/properties/demoMode",
                },
                "domain": {
                  "$ref": "#/components/schemas/App/properties/domain",
                },
                "icon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "iconBackground": {
                  "description": "The background color to use for the maskable icon.",
                  "pattern": "^#[\\dA-Fa-f]{6}$",
                  "type": "string",
                },
                "maskableIcon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "path": {
                  "$ref": "#/components/schemas/App/properties/path",
                },
                "readmes": {
                  "description": "Readmes to showcase in the store",
                  "items": {
                    "format": "binary",
                    "type": "string",
                  },
                  "type": "array",
                },
                "screenshots": {
                  "description": "Screenshots to showcase in the store",
                  "items": {
                    "format": "binary",
                    "type": "string",
                  },
                  "type": "array",
                },
                "sharedStyle": {
                  "description": "The custom style to apply to all parts of app.",
                  "type": "string",
                },
                "supportedLanguages": {
                  "$ref": "#/components/schemas/App/properties/supportedLanguages",
                },
                "template": {
                  "$ref": "#/components/schemas/App/properties/template",
                },
                "visibility": {
                  "$ref": "#/components/schemas/App/properties/visibility",
                },
                "yaml": {
                  "description": "The original YAML definition used to define the app.",
                  "type": "string",
                },
              },
              "required": [
                "OrganizationId",
                "yaml",
              ],
              "type": "object",
            },
            "stack": "instance requires property "OrganizationId"",
          },
        ],
        "message": "Invalid content types found",
      }
    `);
  });

  it('should not allow apps to be created for organizations the user does not belong to', async () => {
    authorizeStudio();
    const response = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: 'a',
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.1
        `),
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Organization not found.",
        "statusCode": 404,
      }
    `);
  });

  it('should not allow to create an app using non-existent blocks', async () => {
    authorizeStudio();
    const response = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: '@non/existent'
                  version: 0.0.0
        `),
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "instance": "@non/existent",
              "message": "is not a known block type",
              "path": [
                "pages",
                0,
                "blocks",
                0,
                "type",
              ],
              "property": "instance.pages[0].blocks[0].type",
              "stack": "instance.pages[0].blocks[0].type is not a known block type",
            },
          ],
        },
        "error": "Bad Request",
        "message": "App validation failed",
        "statusCode": 400,
      }
    `);
  });

  it('should not allow to create an app using non-existent block versions', async () => {
    authorizeStudio();
    const response = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.1
        `),
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "instance": "test",
              "message": "is not a known block type",
              "path": [
                "pages",
                0,
                "blocks",
                0,
                "type",
              ],
              "property": "instance.pages[0].blocks[0].type",
              "stack": "instance.pages[0].blocks[0].type is not a known block type",
            },
          ],
        },
        "error": "Bad Request",
        "message": "App validation failed",
        "statusCode": 400,
      }
    `);
  });

  it('should not allow to create an app using invalid block parameters', async () => {
    authorizeStudio();
    const response = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
                  parameters:
                    foo: invalid
        `),
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "instance": "invalid",
              "message": "is not of a type(s) number",
              "path": [
                "pages",
                0,
                "blocks",
                0,
                "parameters",
                "foo",
              ],
              "property": "instance.pages[0].blocks[0].parameters.foo",
              "stack": "instance.pages[0].blocks[0].parameters.foo is not of a type(s) number",
            },
          ],
        },
        "error": "Bad Request",
        "message": "App validation failed",
        "statusCode": 400,
      }
    `);
  });

  it('should handle app path conflicts on create', async () => {
    authorizeStudio();
    await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
      }),
    );

    const response = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
          "pages": [
            {
              "blocks": [
                {
                  "type": "test",
                  "version": "0.0.0",
                },
              ],
              "name": "Test Page",
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
        "id": 2,
        "locked": "unlocked",
        "metaPixelID": null,
        "msClarityID": null,
        "path": "test-app-2",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "skipGroupInvites": false,
        "supportedLanguages": [
          "en",
        ],
        "template": false,
        "version": 2,
        "visibility": "unlisted",
        "yaml": "
      name: Test App
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
              ",
      }
    `);
  });

  it('should fall back to append random bytes to the end of the app path after 10 attempts', async () => {
    await App.bulkCreate(
      Array.from({ length: 11 }, (unused, index) => ({
        path: index ? `test-app-${index}` : 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: `a${index}`,
        vapidPrivateKey: `b${index}`,
        OrganizationId: organization.id,
      })),
    );
    authorizeStudio();
    const response = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
      }),
    );

    expect(response).toMatchInlineSnapshot(
      { data: { path: expect.stringMatching(/test-app-(\w){10}/) } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
          "pages": [
            {
              "blocks": [
                {
                  "type": "test",
                  "version": "0.0.0",
                },
              ],
              "name": "Test Page",
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
        "id": 12,
        "locked": "unlocked",
        "metaPixelID": null,
        "msClarityID": null,
        "path": StringMatching /test-app-\\(\\\\w\\)\\{10\\}/,
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "skipGroupInvites": false,
        "supportedLanguages": [
          "en",
        ],
        "template": false,
        "version": 1,
        "visibility": "unlisted",
        "yaml": "
      name: Test App
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
              ",
      }
    `,
    );
  });

  it('should allow stylesheets to be included when creating an app', async () => {
    const form = createFormData({
      OrganizationId: organization.id,
      yaml: stripIndent(`
        name: Foobar
        defaultPage: Test Page
        pages:
          - name: Test Page
            blocks:
              - type: test
                version: 0.0.0
      `),
      coreStyle: 'body { color: blue; }',
      sharedStyle: ':root { --primary-color: purple; }',
    });
    authorizeStudio();
    const response = await request.post<AppType>('/api/apps', form);

    const coreStyle = await request.get(`/api/apps/${response.data.id}/style/core`);
    const sharedStyle = await request.get(`/api/apps/${response.data.id}/style/shared`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "coreStyle": "body { color: blue; }",
        "definition": {
          "defaultPage": "Test Page",
          "name": "Foobar",
          "pages": [
            {
              "blocks": [
                {
                  "type": "test",
                  "version": "0.0.0",
                },
              ],
              "name": "Test Page",
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
        "path": "foobar",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "sharedStyle": ":root { --primary-color: purple; }",
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "skipGroupInvites": false,
        "supportedLanguages": [
          "en",
        ],
        "template": false,
        "version": 1,
        "visibility": "unlisted",
        "yaml": "
      name: Foobar
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
            ",
      }
    `);
    expect(coreStyle).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/css; charset=utf-8

      body { color: blue; }
    `);
    expect(sharedStyle).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/css; charset=utf-8

      :root { --primary-color: purple; }
    `);
  });

  it('should not allow invalid core stylesheets when creating an app', async () => {
    const form = createFormData({
      OrganizationId: organization.id,
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
      coreStyle: 'this is invalid css',
    });
    authorizeStudio();
    const response = await request.post('/api/apps', form);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": "yaml",
            "instance": {
              "OrganizationId": "testorganization",
              "coreStyle": "this is invalid css",
              "definition": "{"name":"Test App","defaultPage":"Test Page","pages":[{"name":"Test Page","blocks":[{"type":"test","version":"0.0.0"}]}]}",
            },
            "message": "requires property "yaml"",
            "name": "required",
            "path": [],
            "property": "instance",
            "schema": {
              "properties": {
                "OrganizationId": {
                  "$ref": "#/components/schemas/Organization/properties/id",
                },
                "controllerCode": {
                  "description": "Custom app logic as a JavaScript string",
                  "type": "string",
                },
                "controllerImplementations": {
                  "description": "Appsemble SDK interfaces implementations",
                  "type": "string",
                },
                "coreStyle": {
                  "description": "The custom style to apply to the core app.",
                  "type": "string",
                },
                "demoMode": {
                  "$ref": "#/components/schemas/App/properties/demoMode",
                },
                "domain": {
                  "$ref": "#/components/schemas/App/properties/domain",
                },
                "icon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "iconBackground": {
                  "description": "The background color to use for the maskable icon.",
                  "pattern": "^#[\\dA-Fa-f]{6}$",
                  "type": "string",
                },
                "maskableIcon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "path": {
                  "$ref": "#/components/schemas/App/properties/path",
                },
                "readmes": {
                  "description": "Readmes to showcase in the store",
                  "items": {
                    "format": "binary",
                    "type": "string",
                  },
                  "type": "array",
                },
                "screenshots": {
                  "description": "Screenshots to showcase in the store",
                  "items": {
                    "format": "binary",
                    "type": "string",
                  },
                  "type": "array",
                },
                "sharedStyle": {
                  "description": "The custom style to apply to all parts of app.",
                  "type": "string",
                },
                "supportedLanguages": {
                  "$ref": "#/components/schemas/App/properties/supportedLanguages",
                },
                "template": {
                  "$ref": "#/components/schemas/App/properties/template",
                },
                "visibility": {
                  "$ref": "#/components/schemas/App/properties/visibility",
                },
                "yaml": {
                  "description": "The original YAML definition used to define the app.",
                  "type": "string",
                },
              },
              "required": [
                "OrganizationId",
                "yaml",
              ],
              "type": "object",
            },
            "stack": "instance requires property "yaml"",
          },
        ],
        "message": "Invalid content types found",
      }
    `);
  });

  it('should not allow invalid shared stylesheets when creating an app', async () => {
    const form = createFormData({
      OrganizationId: organization.id,
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        path: 'a',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'testblock' }],
          },
        ],
      },
      sharedStyle: 'this is invalid css',
    });
    authorizeStudio();
    const response = await request.post('/api/apps', form);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": "yaml",
            "instance": {
              "OrganizationId": "testorganization",
              "definition": "{"name":"Test App","defaultPage":"Test Page","path":"a","pages":[{"name":"Test Page","blocks":[{"type":"testblock"}]}]}",
              "sharedStyle": "this is invalid css",
            },
            "message": "requires property "yaml"",
            "name": "required",
            "path": [],
            "property": "instance",
            "schema": {
              "properties": {
                "OrganizationId": {
                  "$ref": "#/components/schemas/Organization/properties/id",
                },
                "controllerCode": {
                  "description": "Custom app logic as a JavaScript string",
                  "type": "string",
                },
                "controllerImplementations": {
                  "description": "Appsemble SDK interfaces implementations",
                  "type": "string",
                },
                "coreStyle": {
                  "description": "The custom style to apply to the core app.",
                  "type": "string",
                },
                "demoMode": {
                  "$ref": "#/components/schemas/App/properties/demoMode",
                },
                "domain": {
                  "$ref": "#/components/schemas/App/properties/domain",
                },
                "icon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "iconBackground": {
                  "description": "The background color to use for the maskable icon.",
                  "pattern": "^#[\\dA-Fa-f]{6}$",
                  "type": "string",
                },
                "maskableIcon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "path": {
                  "$ref": "#/components/schemas/App/properties/path",
                },
                "readmes": {
                  "description": "Readmes to showcase in the store",
                  "items": {
                    "format": "binary",
                    "type": "string",
                  },
                  "type": "array",
                },
                "screenshots": {
                  "description": "Screenshots to showcase in the store",
                  "items": {
                    "format": "binary",
                    "type": "string",
                  },
                  "type": "array",
                },
                "sharedStyle": {
                  "description": "The custom style to apply to all parts of app.",
                  "type": "string",
                },
                "supportedLanguages": {
                  "$ref": "#/components/schemas/App/properties/supportedLanguages",
                },
                "template": {
                  "$ref": "#/components/schemas/App/properties/template",
                },
                "visibility": {
                  "$ref": "#/components/schemas/App/properties/visibility",
                },
                "yaml": {
                  "description": "The original YAML definition used to define the app.",
                  "type": "string",
                },
              },
              "required": [
                "OrganizationId",
                "yaml",
              ],
              "type": "object",
            },
            "stack": "instance requires property "yaml"",
          },
        ],
        "message": "Invalid content types found",
      }
    `);
  });

  describe('block synchronization', () => {
    let mock: MockAdapter;

    beforeEach(() => {
      setArgv({ ...argv, remote: 'https://appsemble.example' });
      mock = new MockAdapter(axios);
    });

    afterEach(() => {
      setArgv(argv);
      mock.reset();
    });

    it('should not synchronize if the remote returns an invalid block name', async () => {
      authorizeStudio();

      mock
        .onGet('https://appsemble.example/api/blocks/@appsemble/upstream/versions/1.2.3')
        .reply(200, {
          name: '@appsemble/invalid',
          version: '1.2.3',
        });
      const response = await request.post(
        '/api/apps',
        createFormData({
          OrganizationId: organization.id,
          path: 'a',
          yaml: stripIndent(`
            name: Test App
            defaultPage: Test Page
            pages:
              - name: Test Page
                blocks:
                  - type: upstream
                    version: 1.2.3
          `),
        }),
      );
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 400 Bad Request
        Content-Type: application/json; charset=utf-8

        {
          "data": {
            "errors": [
              {
                "instance": "upstream",
                "message": "is not a known block type",
                "path": [
                  "pages",
                  0,
                  "blocks",
                  0,
                  "type",
                ],
                "property": "instance.pages[0].blocks[0].type",
                "stack": "instance.pages[0].blocks[0].type is not a known block type",
              },
            ],
          },
          "error": "Bad Request",
          "message": "App validation failed",
          "statusCode": 400,
        }
      `);
    });

    it('should not synchronize if the remote returns an invalid block version', async () => {
      authorizeStudio();

      mock
        .onGet('https://appsemble.example/api/blocks/@appsemble/upstream/versions/1.2.3')
        .reply(200, {
          name: '@appsemble/upstream',
          version: '3.2.1',
        });
      const response = await request.post(
        '/api/apps',
        createFormData({
          OrganizationId: organization.id,
          path: 'a',
          yaml: stripIndent(`
            name: Test App
            defaultPage: Test Page
            pages:
              - name: Test Page
                blocks:
                  - type: upstream
                    version: 1.2.3
          `),
        }),
      );
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 400 Bad Request
        Content-Type: application/json; charset=utf-8

        {
          "data": {
            "errors": [
              {
                "instance": "upstream",
                "message": "is not a known block type",
                "path": [
                  "pages",
                  0,
                  "blocks",
                  0,
                  "type",
                ],
                "property": "instance.pages[0].blocks[0].type",
                "stack": "instance.pages[0].blocks[0].type is not a known block type",
              },
            ],
          },
          "error": "Bad Request",
          "message": "App validation failed",
          "statusCode": 400,
        }
      `);
    });

    it('should not synchronize if the remote returns an invalid status code', async () => {
      authorizeStudio();

      mock
        .onGet('https://appsemble.example/api/blocks/@appsemble/upstream/versions/1.2.3')
        .reply(404, {
          name: '@appsemble/upstream',
          version: '3.2.1',
        });
      const response = await request.post(
        '/api/apps',
        createFormData({
          OrganizationId: organization.id,
          path: 'a',
          yaml: stripIndent(`
            name: Test App
            defaultPage: Test Page
            pages:
              - name: Test Page
                blocks:
                  - type: upstream
                    version: 1.2.3
          `),
        }),
      );
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 400 Bad Request
        Content-Type: application/json; charset=utf-8

        {
          "data": {
            "errors": [
              {
                "instance": "upstream",
                "message": "is not a known block type",
                "path": [
                  "pages",
                  0,
                  "blocks",
                  0,
                  "type",
                ],
                "property": "instance.pages[0].blocks[0].type",
                "stack": "instance.pages[0].blocks[0].type is not a known block type",
              },
            ],
          },
          "error": "Bad Request",
          "message": "App validation failed",
          "statusCode": 400,
        }
      `);
    });

    it('should store the remote block in the local database', async () => {
      authorizeStudio();

      mock
        .onGet('https://appsemble.example/api/blocks/@appsemble/upstream/versions/1.2.3')
        .reply(200, {
          actions: {},
          description: 'This is a block',
          events: {},
          files: ['a.js', 'b.css'],
          iconUrl: null,
          languages: ['en'],
          layout: 'float',
          longDescription: 'This is a useful block.',
          name: '@appsemble/upstream',
          parameters: {},
          version: '1.2.3',
        });
      mock
        .onGet('https://appsemble.example/api/blocks/@appsemble/upstream/versions/1.2.3/asset')
        .reply(({ params: { filename } }) => {
          switch (filename) {
            case 'a.js':
              return [200, 'console.log("a");\n', { 'content-type': 'application/javascript' }];
            case 'b.css':
              return [200, 'b{background:blue;}\n', { 'content-type': 'text/css' }];
            default:
              return [404];
          }
        });
      mock
        .onGet(
          'https://appsemble.example/api/blocks/@appsemble/upstream/versions/1.2.3/messages/en',
        )
        .reply(200, { hello: 'world' });
      const response = await request.post(
        '/api/apps',
        createFormData({
          OrganizationId: organization.id,
          path: 'a',
          yaml: stripIndent(`
            name: Test App
            defaultPage: Test Page
            pages:
              - name: Test Page
                blocks:
                  - type: upstream
                    version: 1.2.3
          `),
        }),
      );
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 201 Created
        Content-Type: application/json; charset=utf-8

        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "controllerCode": null,
          "controllerImplementations": null,
          "definition": {
            "defaultPage": "Test Page",
            "name": "Test App",
            "pages": [
              {
                "blocks": [
                  {
                    "type": "upstream",
                    "version": "1.2.3",
                  },
                ],
                "name": "Test Page",
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
          "path": "test-app",
          "screenshotUrls": [],
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": true,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "skipGroupInvites": false,
          "supportedLanguages": [
            "en",
          ],
          "template": false,
          "version": 1,
          "visibility": "unlisted",
          "yaml": "
        name: Test App
        defaultPage: Test Page
        pages:
          - name: Test Page
            blocks:
              - type: upstream
                version: 1.2.3
                  ",
        }
      `);
      const block = await BlockVersion.findOne({
        where: { OrganizationId: 'appsemble', name: 'upstream' },
        include: [BlockAsset, BlockMessages],
      });
      expect(block).toMatchObject({
        actions: {},
        description: 'This is a block',
        events: {},
        icon: null,
        layout: 'float',
        longDescription: 'This is a useful block.',
        name: 'upstream',
        OrganizationId: 'appsemble',
        parameters: {},
        version: '1.2.3',
        BlockAssets: [
          {
            filename: 'a.js',
            mime: 'application/javascript',
            content: Buffer.from('console.log("a");\n'),
          },
          {
            filename: 'b.css',
            mime: 'text/css',
            content: Buffer.from('b{background:blue;}\n'),
          },
        ],
        BlockMessages: [{ language: 'en', messages: { hello: 'world' } }],
      });
    });
  });

  it('should allow for dry runs without creating an app', async () => {
    authorizeStudio();
    const createdResponse = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        icon: createFixtureStream('nodejs-logo.png'),
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
      }),
      { params: { dryRun: true } },
    );

    const appCount = await App.count();
    expect(createdResponse).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(appCount).toBe(0);
  });

  it('should still return errors during dry runs', async () => {
    authorizeStudio();
    const createdResponse = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        icon: createFixtureStream('nodejs-logo.png'),
        yaml: stripIndent(`
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
      }),
      { params: { dryRun: true } },
    );

    const appCount = await App.count();
    expect(createdResponse).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "argument": "name",
              "instance": {
                "defaultPage": "Test Page",
                "pages": [
                  {
                    "blocks": [
                      {
                        "type": "test",
                        "version": "0.0.0",
                      },
                    ],
                    "name": "Test Page",
                  },
                ],
              },
              "message": "requires property "name"",
              "name": "required",
              "path": [],
              "property": "instance",
              "schema": {
                "additionalProperties": false,
                "description": "An app definition describes what an Appsemble app looks like.",
                "properties": {
                  "anchors": {
                    "description": "Helper property that can be used to store YAML anchors.",
                    "items": {},
                    "minItems": 1,
                    "type": "array",
                  },
                  "containers": {
                    "additionalProperties": false,
                    "description": "Definition of the companion containers to be created.",
                    "items": {
                      "$ref": "#/components/schemas/ContainerDefinition",
                    },
                    "minItems": 1,
                    "type": "array",
                  },
                  "controller": {
                    "$ref": "#/components/schemas/ControllerDefinition",
                  },
                  "cron": {
                    "additionalProperties": {
                      "$ref": "#/components/schemas/CronDefinition",
                    },
                    "description": "A list of cron jobs that are associated with this app.",
                    "minProperties": 1,
                    "type": "object",
                  },
                  "defaultLanguage": {
                    "default": "en",
                    "description": "The default language for the app.",
                    "minLength": 2,
                    "type": "string",
                  },
                  "defaultPage": {
                    "description": "The name of the page that should be displayed when the app is initially loaded.

      This **must** match the name of a page defined for the app.
      ",
                    "type": "string",
                  },
                  "description": {
                    "description": "A short description describing the app.

      This will be displayed on the app store.
      ",
                    "maxLength": 80,
                    "type": "string",
                  },
                  "layout": {
                    "$ref": "#/components/schemas/AppLayoutDefinition",
                    "description": "Properties related to the layout of the app.",
                  },
                  "members": {
                    "$ref": "#/components/schemas/AppMembersDefinition",
                  },
                  "name": {
                    "description": "The human readable name of the app.

      This will be displayed for example on the home screen or in the browser tab.
      ",
                    "maxLength": 30,
                    "minLength": 1,
                    "type": "string",
                  },
                  "notifications": {
                    "description": "The strategy to use for apps to subscribe to push notifications.

      If specified, push notifications can be sent to subscribed users via the _Notifications_ tab in the
      app details page in Appsemble Studio. Setting this to \`opt-in\` allows for users to opt into
      receiving push notifications by pressing the subscribe button in the App settings page. Setting this
      to \`startup\` will cause Appsemble to immediately request for the permission upon opening the app.
      If this is set to \`login\`, the app will request permissions for push notification once the user
      logs in.

      > **Note**: Setting \`notifications\` to \`startup\` is not recommended, due to its invasive nature.
      ",
                    "enum": [
                      "login",
                      "opt-in",
                      "startup",
                    ],
                  },
                  "pages": {
                    "description": "The pages of the app.",
                    "items": {
                      "anyOf": [
                        {
                          "$ref": "#/components/schemas/PageDefinition",
                        },
                        {
                          "$ref": "#/components/schemas/TabsPageDefinition",
                        },
                        {
                          "$ref": "#/components/schemas/FlowPageDefinition",
                        },
                        {
                          "$ref": "#/components/schemas/LoopPageDefinition",
                        },
                        {
                          "$ref": "#/components/schemas/ContainerPageDefinition",
                        },
                      ],
                    },
                    "minItems": 1,
                    "type": "array",
                  },
                  "registry": {
                    "default": null,
                    "description": "The default registry used to pull images for companion containers.",
                    "type": "string",
                  },
                  "resources": {
                    "additionalProperties": {
                      "$ref": "#/components/schemas/ResourceDefinition",
                      "description": "A single resource definition.",
                    },
                    "description": "Resources define how Appsemble can store data for an app.

      The most basic resource has a \`schema\` property and defines the minimal security rules.
      ",
                    "type": "object",
                  },
                  "security": {
                    "$ref": "#/components/schemas/SecurityDefinition",
                    "description": "Role and guest definitions that may be used by the app.",
                  },
                  "theme": {
                    "$ref": "#/components/schemas/Theme",
                  },
                  "webhooks": {
                    "additionalProperties": {
                      "$ref": "#/components/schemas/WebhookDefinition",
                    },
                    "description": "A list of callable webhooks that are associated with this app.",
                    "minProperties": 1,
                    "type": "object",
                  },
                },
                "required": [
                  "name",
                  "defaultPage",
                  "pages",
                ],
                "type": "object",
              },
              "stack": "instance requires property "name"",
            },
          ],
        },
        "error": "Bad Request",
        "message": "App validation failed",
        "statusCode": 400,
      }
    `);
    expect(appCount).toBe(0);
  });

  it('should use argv for database parameters if present', async () => {
    const databaseName = process.env.DATABASE_NAME || 'appsemble';
    const databaseHost = process.env.DATABASE_HOST || 'localhost';
    const databasePort = Number(process.env.DATABASE_PORT) || 54_321;
    const databaseUser = process.env.DATABASE_USER || 'admin';
    const databasePassword = process.env.DATABASE_PASSWORD || 'password';
    setArgv({
      ...argv,
      databaseName,
      databaseHost,
      databasePort,
      databaseUser,
      databasePassword,
    });
    authorizeStudio();
    const response = await request.post<AppType>(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        icon: createFixtureStream('nodejs-logo.png'),
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
      }),
    );
    const app = await App.findByPk(response.data.id, {
      attributes: ['dbName', 'dbHost', 'dbPort', 'dbUser', 'dbPassword'],
    });
    expect(app?.get()).toStrictEqual(
      expect.objectContaining({
        dbName: null,
        dbHost: databaseHost,
        dbPort: databasePort,
        dbUser: databaseUser,
      }),
    );
    expect(decrypt(app!.dbPassword, 'testSecret')).toBe(databasePassword);
  });

  it('should fallback to process.env for database parameters if argv not present', async () => {
    const databaseName = process.env.DATABASE_NAME || 'appsemble';
    const databaseHost = process.env.DATABASE_HOST || 'localhost';
    const databasePort = Number(process.env.DATABASE_PORT) || 54_321;
    const databaseUser = process.env.DATABASE_USER || 'admin';
    const databasePassword = process.env.DATABASE_PASSWORD || 'password';

    process.env.DATABASE_NAME = databaseName;
    process.env.DATABASE_HOST = databaseHost;
    process.env.DATABASE_PORT = String(databasePort);
    process.env.DATABASE_USER = databaseUser;
    process.env.DATABASE_PASSWORD = databasePassword;
    authorizeStudio();
    const response = await request.post<AppType>(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        icon: createFixtureStream('nodejs-logo.png'),
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
      }),
    );
    const app = await App.findByPk(response.data.id, {
      attributes: ['dbName', 'dbHost', 'dbPort', 'dbUser', 'dbPassword'],
    });
    expect(app?.get()).toStrictEqual(
      expect.objectContaining({
        dbName: null,
        dbHost: databaseHost,
        dbPort: databasePort,
        dbUser: databaseUser,
      }),
    );
    expect(decrypt(app!.dbPassword, 'testSecret')).toBe(databasePassword);
  });

  it('should use passed database parameters if present', async () => {
    vi.useRealTimers();
    authorizeStudio();
    const dbUser = 'app-admin';
    const dbPassword = 'app-password';
    const dbName = 'app-db';
    const appDB = await createTestDBWithUser({ dbUser, dbPassword, dbName });
    const response = await request.post<AppType>(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        icon: createFixtureStream('nodejs-logo.png'),
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
        ...appDB,
        dbPassword,
      }),
    );
    const app = await App.findByPk(response.data.id, {
      attributes: ['dbName', 'dbHost', 'dbPort', 'dbUser', 'dbPassword'],
    });
    expect(app?.get()).toStrictEqual(expect.objectContaining(appDB));
    expect(decrypt(app!.dbPassword, 'testSecret')).toBe(dbPassword);
  });

  it('should not create a new app using a template when app limit is reached', async () => {
    authorizeStudio();
    await App.create(
      {
        definition: { name: 'Test App 1', defaultPage: 'Test Page' },
        path: 'test-app-1',
        vapidPublicKey: 'e',
        vapidPrivateKey: 'f',
        OrganizationId: organization.id,
        visibility: 'public',
      },
      { raw: true },
    );
    await App.create(
      {
        definition: { name: 'Test App 2', defaultPage: 'Test Page' },
        path: 'test-app-2',
        vapidPublicKey: 'e',
        vapidPrivateKey: 'f',
        OrganizationId: organization.id,
        visibility: 'public',
      },
      { raw: true },
    );
    await App.create(
      {
        definition: { name: 'Test App 3', defaultPage: 'Test Page' },
        path: 'test-app-3',
        vapidPublicKey: 'e',
        vapidPrivateKey: 'f',
        OrganizationId: organization.id,
        visibility: 'public',
      },
      { raw: true },
    );
    const response = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        yaml: stripIndent(`
          name: test app 4
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
        visibility: 'public',
      }),
    );

    expect(response.status).toBe(403);
  });

  it('should create a new app using a template when default app limit is reached but a subscription is active', async () => {
    authorizeStudio();
    const subscription = await OrganizationSubscription.findOne({
      where: { OrganizationId: 'testorganization' },
    });
    expect(subscription).not.toBeNull();
    subscription!.subscriptionPlan = SubscriptionPlanType.Basic;
    subscription!.save();
    const apps = await App.findAll({ where: { OrganizationId: 'testorganization' } });
    for (const app of apps) {
      app.visibility = 'public';
      await app.save();
    }
    await App.create(
      {
        definition: { name: 'Test App 3', defaultPage: 'Test Page' },
        path: 'test-app-3',
        vapidPublicKey: 'e',
        vapidPrivateKey: 'f',
        OrganizationId: 'testorganization',
        visibility: 'public',
      },
      { raw: true },
    );
    const response = await request.post(
      '/api/apps',
      createFormData({
        OrganizationId: organization.id,
        yaml: stripIndent(`
          name: test app 4
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
        visbility: 'public',
      }),
      { params: { dryRun: true } },
    );

    expect(response.status).toBe(204);
  });
});

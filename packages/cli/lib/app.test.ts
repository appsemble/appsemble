import { authenticate, readFixture, resolveFixture } from '@appsemble/node-utils';
import {
  authorizeClientCredentials,
  createServer,
  createTestUser,
  models,
  setArgv,
  useTestDatabase,
} from '@appsemble/server';
import { ISODateTimePattern } from '@appsemble/utils';
import { type AxiosTestInstance, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { patchApp, publishApp, updateApp } from './app.js';
import { initAxios } from './initAxios.js';

const {
  App,
  AppBlockStyle,
  AppCollection,
  AppCollectionApp,
  AppMessages,
  AppScreenshot,
  Asset,
  BlockVersion,
  Organization,
  OrganizationMember,
  Resource,
} = models;
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };
let user: models.User;
let organization: models.Organization;
let testApp: AxiosTestInstance;

async function authorizeCLI(scopes: string): Promise<string> {
  const OAuth2AuthorizationCode = await authorizeClientCredentials(scopes);
  const { id, secret } = OAuth2AuthorizationCode;
  await OAuth2AuthorizationCode.update({ secret: await hash(secret, 10) });
  await authenticate(testApp.defaults.baseURL, scopes, `${id}:${secret}`);
  return `${id}:${secret}`;
}

useTestDatabase(import.meta);

beforeAll(() => {
  vi.useFakeTimers();
  setArgv(argv);
});

beforeEach(async () => {
  vi.clearAllTimers();
  vi.setSystemTime(0);
  const server = await createServer();
  testApp = await setTestApp(server);
  initAxios({ remote: testApp.defaults.baseURL });
  user = await createTestUser();
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await OrganizationMember.create({
    OrganizationId: organization.id,
    UserId: user.id,
    role: 'Owner',
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

describe('publishApp', () => {
  it('should publish app', async () => {
    vi.useRealTimers();
    const clientCredentials = await authorizeCLI('apps:write resources:write');
    await publishApp({
      path: resolveFixture('apps/test'),
      organization: organization.id,
      remote: testApp.defaults.baseURL,
      clientCredentials,
      // Required defaults
      visibility: 'unlisted',
      iconBackground: '#ffffff',
    });
    vi.useFakeTimers();
    const app = await App.findOne();
    expect(app.toJSON()).toMatchInlineSnapshot(
      {
        $created: expect.stringMatching(ISODateTimePattern),
        $updated: expect.stringMatching(ISODateTimePattern),
        iconUrl: expect.any(String),
      },
      `
      {
        "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "OrganizationId": "testorganization",
        "OrganizationName": undefined,
        "controllerCode": null,
        "controllerImplementations": null,
        "coreStyle": ".tux {
        color: rgb(0 0 0);
      }
      ",
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
          "resources": {
            "test": {
              "schema": {
                "additionalProperties": false,
                "properties": {
                  "test": {
                    "format": "binary",
                    "type": "string",
                  },
                },
                "type": "object",
              },
            },
          },
        },
        "demoMode": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasClonableAssets": undefined,
        "hasClonableResources": undefined,
        "hasIcon": true,
        "hasMaskableIcon": true,
        "iconBackground": "#ffffff",
        "iconUrl": Any<String>,
        "id": 1,
        "locked": "unlocked",
        "messages": undefined,
        "path": "test-app",
        "rating": undefined,
        "readmeUrl": undefined,
        "screenshotUrls": undefined,
        "sentryDsn": null,
        "sentryEnvironment": null,
        "sharedStyle": ".tux {
        color: rgb(0 0 0);
      }
      ",
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      resources:
        test:
          schema:
            additionalProperties: false
            type: object
            properties:
              test:
                type: string
                format: binary
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
      ",
      }
    `,
    );
    expect(app.icon).toStrictEqual(await readFixture('apps/test/icon.png'));
    expect(app.maskableIcon).toStrictEqual(await readFixture('apps/test/maskable-icon.png'));
    const appBlockStyle = await AppBlockStyle.findOne();
    expect(appBlockStyle.style).toBe(`.tux {
  color: rgb(0 0 0);
}`);
    const appScreenshot = await AppScreenshot.findOne();
    expect(appScreenshot.screenshot).toStrictEqual(
      await readFixture('apps/test/screenshots/test_en-us.png'),
    );
    const appMessages = await AppMessages.findAll({ order: [['language', 'DESC']] });
    expect(appMessages.map(({ language, messages }) => [language, messages])).toStrictEqual([
      ['nl', JSON.parse(String(await readFixture('apps/test/i18n/nl.json')))],
      ['en', JSON.parse(String(await readFixture('apps/test/i18n/en.json')))],
    ]);
    const resource = await Resource.findAll();
    expect(resource).toStrictEqual([]);
    const asset = await Asset.findAll();
    expect(asset).toStrictEqual([]);
  });

  it('should publish app with resources and assets', async () => {
    vi.useRealTimers();
    const clientCredentials = await authorizeCLI('apps:write resources:write');
    await publishApp({
      path: resolveFixture('apps/test'),
      organization: organization.id,
      remote: testApp.defaults.baseURL,
      clientCredentials,
      // Required defaults
      visibility: 'unlisted',
      iconBackground: '#ffffff',
      // Additional
      resources: true,
      assets: true,
    });
    vi.useFakeTimers();
    const app = await App.findOne();
    expect(app.toJSON()).toMatchInlineSnapshot(
      {
        $created: expect.stringMatching(ISODateTimePattern),
        $updated: expect.stringMatching(ISODateTimePattern),
        iconUrl: expect.any(String),
      },
      `
      {
        "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "OrganizationId": "testorganization",
        "OrganizationName": undefined,
        "controllerCode": null,
        "controllerImplementations": null,
        "coreStyle": ".tux {
        color: rgb(0 0 0);
      }
      ",
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
          "resources": {
            "test": {
              "schema": {
                "additionalProperties": false,
                "properties": {
                  "test": {
                    "format": "binary",
                    "type": "string",
                  },
                },
                "type": "object",
              },
            },
          },
        },
        "demoMode": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasClonableAssets": undefined,
        "hasClonableResources": undefined,
        "hasIcon": true,
        "hasMaskableIcon": true,
        "iconBackground": "#ffffff",
        "iconUrl": Any<String>,
        "id": 1,
        "locked": "unlocked",
        "messages": undefined,
        "path": "test-app",
        "rating": undefined,
        "readmeUrl": undefined,
        "screenshotUrls": undefined,
        "sentryDsn": null,
        "sentryEnvironment": null,
        "sharedStyle": ".tux {
        color: rgb(0 0 0);
      }
      ",
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      resources:
        test:
          schema:
            additionalProperties: false
            type: object
            properties:
              test:
                type: string
                format: binary
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
      ",
      }
    `,
    );
    expect(app.icon).toStrictEqual(await readFixture('apps/test/icon.png'));
    expect(app.maskableIcon).toStrictEqual(await readFixture('apps/test/maskable-icon.png'));
    const appBlockStyle = await AppBlockStyle.findOne();
    expect(appBlockStyle.style).toBe(`.tux {
  color: rgb(0 0 0);
}`);
    const appScreenshot = await AppScreenshot.findOne();
    expect(appScreenshot.screenshot).toStrictEqual(
      await readFixture('apps/test/screenshots/test_en-us.png'),
    );
    const appMessages = await AppMessages.findAll({ order: [['language', 'DESC']] });
    expect(appMessages.map(({ language, messages }) => [language, messages])).toStrictEqual([
      ['nl', JSON.parse(String(await readFixture('apps/test/i18n/nl.json')))],
      ['en', JSON.parse(String(await readFixture('apps/test/i18n/en.json')))],
    ]);
    const resources = await Resource.findAll();
    expect(resources.map((r) => r.toJSON())).toMatchInlineSnapshot(
      [
        {
          $created: expect.stringMatching(ISODateTimePattern),
          $updated: expect.stringMatching(ISODateTimePattern),
        },
      ],
      `
      [
        {
          "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "id": 1,
          "test": "tux",
        },
      ]
    `,
    );
    const assets = await Asset.findAll();
    expect(assets.map((a) => a.data)).toStrictEqual([
      await readFixture('apps/test/assets/tux.png'),
    ]);
  });

  it('should publish app with runtime config', async () => {
    await AppCollection.create({
      name: 'test',
      expertName: 'Expert',
      expertProfileImage: Buffer.alloc(0),
      expertProfileImageMimeType: 'image/png',
      headerImage: Buffer.alloc(0),
      headerImageMimeType: 'image/png',
      OrganizationId: organization.id,
      visibility: 'public',
    });
    vi.useRealTimers();
    const clientCredentials = await authorizeCLI('apps:write resources:write');
    await publishApp({
      path: resolveFixture('apps/test'),
      organization: organization.id,
      remote: testApp.defaults.baseURL,
      clientCredentials,
      // Required defaults
      visibility: 'unlisted',
      iconBackground: '#ffffff',
      // Define context
      context: 'test',
    });
    vi.useFakeTimers();
    const app = await App.findOne();
    expect(app.toJSON()).toMatchInlineSnapshot(
      {
        $created: expect.stringMatching(ISODateTimePattern),
        $updated: expect.stringMatching(ISODateTimePattern),
        iconUrl: expect.any(String),
      },
      `
      {
        "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "OrganizationId": "testorganization",
        "OrganizationName": undefined,
        "controllerCode": null,
        "controllerImplementations": null,
        "coreStyle": ".tux {
        color: rgb(0 0 0);
      }
      ",
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
          "resources": {
            "test": {
              "schema": {
                "additionalProperties": false,
                "properties": {
                  "test": {
                    "format": "binary",
                    "type": "string",
                  },
                },
                "type": "object",
              },
            },
          },
        },
        "demoMode": true,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": "test",
        "hasClonableAssets": undefined,
        "hasClonableResources": undefined,
        "hasIcon": true,
        "hasMaskableIcon": true,
        "iconBackground": "#000000",
        "iconUrl": Any<String>,
        "id": 1,
        "locked": "unlocked",
        "messages": undefined,
        "path": "test-app",
        "rating": undefined,
        "readmeUrl": undefined,
        "screenshotUrls": undefined,
        "sentryDsn": "https://public@sentry.example.com/1",
        "sentryEnvironment": "test",
        "sharedStyle": ".tux {
        color: rgb(0 0 0);
      }
      ",
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "public",
        "yaml": "name: Test App
      defaultPage: Test Page
      resources:
        test:
          schema:
            additionalProperties: false
            type: object
            properties:
              test:
                type: string
                format: binary
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
      ",
      }
    `,
    );
    expect(app.icon).toStrictEqual(await readFixture('apps/test/icon.png'));
    expect(app.maskableIcon).toStrictEqual(await readFixture('apps/test/maskable-icon.png'));
    const appBlockStyle = await AppBlockStyle.findOne();
    expect(appBlockStyle.style).toBe(`.tux {
  color: rgb(0 0 0);
}`);
    const appScreenshot = await AppScreenshot.findOne();
    expect(appScreenshot.screenshot).toStrictEqual(
      await readFixture('apps/test/screenshots/test_en-us.png'),
    );
    const appMessages = await AppMessages.findAll({ order: [['language', 'DESC']] });
    expect(appMessages.map(({ language, messages }) => [language, messages])).toStrictEqual([
      ['nl', JSON.parse(String(await readFixture('apps/test/i18n/nl.json')))],
      ['en', JSON.parse(String(await readFixture('apps/test/i18n/en.json')))],
    ]);
    const resources = await Resource.findAll();
    expect(resources.map((r) => r.toJSON())).toMatchInlineSnapshot(
      [
        {
          $created: expect.stringMatching(ISODateTimePattern),
          $updated: expect.stringMatching(ISODateTimePattern),
        },
        {
          $created: expect.stringMatching(ISODateTimePattern),
          $updated: expect.stringMatching(ISODateTimePattern),
        },
      ],
      `
      [
        {
          "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "id": 1,
          "test": "tux",
        },
        {
          "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "$ephemeral": true,
          "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "id": 2,
          "test": "tux",
        },
      ]
    `,
    );
    const assets = await Asset.findAll();
    expect(assets.map((a) => a.data)).toStrictEqual([
      await readFixture('apps/test/assets/tux.png'),
      await readFixture('apps/test/assets/tux.png'),
    ]);
    const appCollectionApp = await AppCollectionApp.findOne();
    expect(appCollectionApp.AppId).toBe(1);
    expect(appCollectionApp.AppCollectionId).toBe(1);
  });

  it('should publish app with app variant patches applied', async () => {
    vi.useRealTimers();
    const clientCredentials = await authorizeCLI('apps:write resources:write');
    await publishApp({
      path: resolveFixture('apps/test'),
      organization: organization.id,
      remote: testApp.defaults.baseURL,
      clientCredentials,
      // Required defaults
      visibility: 'unlisted',
      iconBackground: '#ffffff',
      // Define app variant
      variant: 'tux',
      resources: true,
      assets: true,
    });
    vi.useFakeTimers();
    const app = await App.findOne();
    expect(app.toJSON()).toMatchInlineSnapshot(
      {
        $created: expect.stringMatching(ISODateTimePattern),
        $updated: expect.stringMatching(ISODateTimePattern),
        iconUrl: expect.any(String),
      },
      `
      {
        "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "OrganizationId": "testorganization",
        "OrganizationName": undefined,
        "controllerCode": null,
        "controllerImplementations": null,
        "coreStyle": ".tux{color:rgb(1 2 3)}",
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
          "resources": {
            "test": {
              "schema": {
                "additionalProperties": false,
                "properties": {
                  "tux": {
                    "format": "binary",
                    "type": "string",
                  },
                },
                "type": "object",
              },
            },
          },
        },
        "demoMode": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasClonableAssets": undefined,
        "hasClonableResources": undefined,
        "hasIcon": true,
        "hasMaskableIcon": true,
        "iconBackground": "#ffffff",
        "iconUrl": Any<String>,
        "id": 1,
        "locked": "unlocked",
        "messages": undefined,
        "path": "test-app",
        "rating": undefined,
        "readmeUrl": undefined,
        "screenshotUrls": undefined,
        "sentryDsn": null,
        "sentryEnvironment": null,
        "sharedStyle": ".tux{color:rgb(1 2 3)}",
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      resources:
        test:
          schema:
            additionalProperties: false
            type: object
            properties:
              tux:
                type: string
                format: binary
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
      ",
      }
    `,
    );
    expect(app.icon).toStrictEqual(await readFixture('apps/test/variants/tux/icon.png'));
    // TODO: not supported yet
    // expect(app.maskableIcon).toStrictEqual(
    //   await readFixture('apps/test/variants/tux/maskable-icon.png'),
    // );
    const appBlockStyle = await AppBlockStyle.findOne();
    expect(appBlockStyle.style).toBe('.tux{color:rgb(1 2 3)}');
    const appScreenshot = await AppScreenshot.findOne();
    expect(appScreenshot.screenshot).toStrictEqual(
      await readFixture('apps/test/variants/tux/screenshots/tux.png'),
    );
    const appMessages = await AppMessages.findAll({ order: [['language', 'DESC']] });
    const messages = JSON.parse(
      String(await readFixture('apps/test/variants/tux/patches/messages.json')),
    );
    expect(appMessages.map(({ language, messages: msgs }) => [language, msgs])).toStrictEqual([
      ['nl', messages.nl],
      ['en', messages.en],
    ]);
    const resources = await Resource.findAll();
    expect(resources.map((r) => r.toJSON())).toMatchInlineSnapshot(
      [
        {
          $created: expect.stringMatching(ISODateTimePattern),
          $updated: expect.stringMatching(ISODateTimePattern),
        },
      ],
      `
      [
        {
          "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "id": 1,
          "tux": "small-tux",
        },
      ]
    `,
    );
    const assets = await Asset.findAll();
    expect(assets.map((a) => a.data)).toStrictEqual([
      await readFixture('apps/test/variants/tux/assets/small-tux.png'),
    ]);
  });
});

describe('updateApp', () => {
  let app: models.App;

  beforeEach(async () => {
    app = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      visibility: 'public',
      OrganizationId: organization.id,
    });
  });

  it('should update app', async () => {
    vi.useRealTimers();
    const clientCredentials = await authorizeCLI('apps:write resources:write');
    await updateApp({
      id: app.id,
      path: resolveFixture('apps/test'),
      remote: testApp.defaults.baseURL,
      clientCredentials,
      // Required defaults
      visibility: 'unlisted',
      iconBackground: '#ffffff',
      force: false,
    });
    vi.useFakeTimers();
    await app.reload();
    expect(app.toJSON()).toMatchInlineSnapshot(
      {
        $created: expect.stringMatching(ISODateTimePattern),
        $updated: expect.stringMatching(ISODateTimePattern),
        iconUrl: expect.any(String),
      },
      `
      {
        "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "OrganizationId": "testorganization",
        "OrganizationName": undefined,
        "controllerCode": null,
        "controllerImplementations": null,
        "coreStyle": ".tux {
        color: rgb(0 0 0);
      }
      ",
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
          "resources": {
            "test": {
              "schema": {
                "additionalProperties": false,
                "properties": {
                  "test": {
                    "format": "binary",
                    "type": "string",
                  },
                },
                "type": "object",
              },
            },
          },
        },
        "demoMode": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasClonableAssets": undefined,
        "hasClonableResources": undefined,
        "hasIcon": true,
        "hasMaskableIcon": true,
        "iconBackground": "#ffffff",
        "iconUrl": Any<String>,
        "id": 1,
        "locked": "unlocked",
        "messages": undefined,
        "path": "test-app",
        "rating": undefined,
        "readmeUrl": undefined,
        "screenshotUrls": undefined,
        "sentryDsn": null,
        "sentryEnvironment": null,
        "sharedStyle": ".tux {
        color: rgb(0 0 0);
      }
      ",
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      resources:
        test:
          schema:
            additionalProperties: false
            type: object
            properties:
              test:
                type: string
                format: binary
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
      ",
      }
    `,
    );
    expect(app.icon).toStrictEqual(await readFixture('apps/test/icon.png'));
    expect(app.maskableIcon).toStrictEqual(await readFixture('apps/test/maskable-icon.png'));
    const appBlockStyle = await AppBlockStyle.findOne();
    expect(appBlockStyle.style).toBe(`.tux {
  color: rgb(0 0 0);
}`);
    const appScreenshot = await AppScreenshot.findOne();
    expect(appScreenshot.screenshot).toStrictEqual(
      await readFixture('apps/test/screenshots/test_en-us.png'),
    );
    const appMessages = await AppMessages.findAll({ order: [['language', 'DESC']] });
    expect(appMessages.map(({ language, messages }) => [language, messages])).toStrictEqual([
      ['nl', JSON.parse(String(await readFixture('apps/test/i18n/nl.json')))],
      ['en', JSON.parse(String(await readFixture('apps/test/i18n/en.json')))],
    ]);
    const resource = await Resource.findAll();
    expect(resource).toStrictEqual([]);
    const asset = await Asset.findAll();
    expect(asset).toStrictEqual([]);
  });

  it('should update app with resources and assets', async () => {
    vi.useRealTimers();
    const clientCredentials = await authorizeCLI('apps:write resources:write');
    await updateApp({
      id: app.id,
      path: resolveFixture('apps/test'),
      remote: testApp.defaults.baseURL,
      clientCredentials,
      // Required defaults
      visibility: 'unlisted',
      iconBackground: '#ffffff',
      force: false,
      // Additional
      resources: true,
      assets: true,
    });
    vi.useFakeTimers();
    await app.reload();
    expect(app.toJSON()).toMatchInlineSnapshot(
      {
        $created: expect.stringMatching(ISODateTimePattern),
        $updated: expect.stringMatching(ISODateTimePattern),
        iconUrl: expect.any(String),
      },
      `
      {
        "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "OrganizationId": "testorganization",
        "OrganizationName": undefined,
        "controllerCode": null,
        "controllerImplementations": null,
        "coreStyle": ".tux {
        color: rgb(0 0 0);
      }
      ",
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
          "resources": {
            "test": {
              "schema": {
                "additionalProperties": false,
                "properties": {
                  "test": {
                    "format": "binary",
                    "type": "string",
                  },
                },
                "type": "object",
              },
            },
          },
        },
        "demoMode": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasClonableAssets": undefined,
        "hasClonableResources": undefined,
        "hasIcon": true,
        "hasMaskableIcon": true,
        "iconBackground": "#ffffff",
        "iconUrl": Any<String>,
        "id": 1,
        "locked": "unlocked",
        "messages": undefined,
        "path": "test-app",
        "rating": undefined,
        "readmeUrl": undefined,
        "screenshotUrls": undefined,
        "sentryDsn": null,
        "sentryEnvironment": null,
        "sharedStyle": ".tux {
        color: rgb(0 0 0);
      }
      ",
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      resources:
        test:
          schema:
            additionalProperties: false
            type: object
            properties:
              test:
                type: string
                format: binary
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
      ",
      }
    `,
    );
    expect(app.icon).toStrictEqual(await readFixture('apps/test/icon.png'));
    expect(app.maskableIcon).toStrictEqual(await readFixture('apps/test/maskable-icon.png'));
    const appBlockStyle = await AppBlockStyle.findOne();
    expect(appBlockStyle.style).toBe(`.tux {
  color: rgb(0 0 0);
}`);
    const appScreenshot = await AppScreenshot.findOne();
    expect(appScreenshot.screenshot).toStrictEqual(
      await readFixture('apps/test/screenshots/test_en-us.png'),
    );
    const appMessages = await AppMessages.findAll({ order: [['language', 'DESC']] });
    expect(appMessages.map(({ language, messages }) => [language, messages])).toStrictEqual([
      ['nl', JSON.parse(String(await readFixture('apps/test/i18n/nl.json')))],
      ['en', JSON.parse(String(await readFixture('apps/test/i18n/en.json')))],
    ]);
    const resources = await Resource.findAll();
    expect(resources.map((r) => r.toJSON())).toMatchInlineSnapshot(
      [
        {
          $created: expect.stringMatching(ISODateTimePattern),
          $updated: expect.stringMatching(ISODateTimePattern),
        },
      ],
      `
      [
        {
          "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "id": 1,
          "test": "tux",
        },
      ]
    `,
    );
    const assets = await Asset.findAll();
    expect(assets.map((a) => a.data)).toStrictEqual([
      await readFixture('apps/test/assets/tux.png'),
    ]);
  });

  it('should update app with runtime config', async () => {
    await AppCollection.create({
      name: 'test',
      expertName: 'Expert',
      expertProfileImage: Buffer.alloc(0),
      expertProfileImageMimeType: 'image/png',
      headerImage: Buffer.alloc(0),
      headerImageMimeType: 'image/png',
      OrganizationId: organization.id,
      visibility: 'public',
    });
    vi.useRealTimers();
    const clientCredentials = await authorizeCLI('apps:write resources:write');
    await updateApp({
      path: resolveFixture('apps/test'),
      id: app.id,
      remote: testApp.defaults.baseURL,
      clientCredentials,
      // Required defaults
      visibility: 'unlisted',
      iconBackground: '#ffffff',
      force: false,
      // Define context
      context: 'test',
    });
    vi.useFakeTimers();
    await app.reload();
    expect(app.toJSON()).toMatchInlineSnapshot(
      {
        $created: expect.stringMatching(ISODateTimePattern),
        $updated: expect.stringMatching(ISODateTimePattern),
        iconUrl: expect.any(String),
      },
      `
      {
        "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "OrganizationId": "testorganization",
        "OrganizationName": undefined,
        "controllerCode": null,
        "controllerImplementations": null,
        "coreStyle": ".tux {
        color: rgb(0 0 0);
      }
      ",
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
          "resources": {
            "test": {
              "schema": {
                "additionalProperties": false,
                "properties": {
                  "test": {
                    "format": "binary",
                    "type": "string",
                  },
                },
                "type": "object",
              },
            },
          },
        },
        "demoMode": true,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": "test",
        "hasClonableAssets": undefined,
        "hasClonableResources": undefined,
        "hasIcon": true,
        "hasMaskableIcon": true,
        "iconBackground": "#000000",
        "iconUrl": Any<String>,
        "id": 1,
        "locked": "studioLock",
        "messages": undefined,
        "path": "test-app",
        "rating": undefined,
        "readmeUrl": undefined,
        "screenshotUrls": undefined,
        "sentryDsn": "https://public@sentry.example.com/1",
        "sentryEnvironment": "test",
        "sharedStyle": ".tux {
        color: rgb(0 0 0);
      }
      ",
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "public",
        "yaml": "name: Test App
      defaultPage: Test Page
      resources:
        test:
          schema:
            additionalProperties: false
            type: object
            properties:
              test:
                type: string
                format: binary
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
      ",
      }
    `,
    );
    expect(app.icon).toStrictEqual(await readFixture('apps/test/icon.png'));
    expect(app.maskableIcon).toStrictEqual(await readFixture('apps/test/maskable-icon.png'));
    const appBlockStyle = await AppBlockStyle.findOne();
    expect(appBlockStyle.style).toBe(`.tux {
  color: rgb(0 0 0);
}`);
    const appScreenshot = await AppScreenshot.findOne();
    expect(appScreenshot.screenshot).toStrictEqual(
      await readFixture('apps/test/screenshots/test_en-us.png'),
    );
    const appMessages = await AppMessages.findAll({ order: [['language', 'DESC']] });
    expect(appMessages.map(({ language, messages }) => [language, messages])).toStrictEqual([
      ['nl', JSON.parse(String(await readFixture('apps/test/i18n/nl.json')))],
      ['en', JSON.parse(String(await readFixture('apps/test/i18n/en.json')))],
    ]);
    const resources = await Resource.findAll();
    expect(resources.map((r) => r.toJSON())).toMatchInlineSnapshot(
      [
        {
          $created: expect.stringMatching(ISODateTimePattern),
          $updated: expect.stringMatching(ISODateTimePattern),
        },
        {
          $created: expect.stringMatching(ISODateTimePattern),
          $updated: expect.stringMatching(ISODateTimePattern),
        },
      ],
      `
      [
        {
          "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "id": 1,
          "test": "tux",
        },
        {
          "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "$ephemeral": true,
          "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "id": 2,
          "test": "tux",
        },
      ]
    `,
    );
    const assets = await Asset.findAll();
    expect(assets.map((a) => a.data)).toStrictEqual([
      await readFixture('apps/test/assets/tux.png'),
      await readFixture('apps/test/assets/tux.png'),
    ]);
    // TODO: not yet implemented
    // const appCollectionApp = await AppCollectionApp.findOne();
    // expect(appCollectionApp.AppId).toBe(1);
    // expect(appCollectionApp.AppCollectionId).toBe(1);
  });

  it('should update app with app variant patches applied', async () => {
    vi.useRealTimers();
    const clientCredentials = await authorizeCLI('apps:write resources:write');
    await updateApp({
      path: resolveFixture('apps/test'),
      id: app.id,
      remote: testApp.defaults.baseURL,
      clientCredentials,
      // Required defaults
      visibility: 'unlisted',
      iconBackground: '#ffffff',
      force: false,
      // Define app variant
      variant: 'tux',
      resources: true,
      assets: true,
    });
    vi.useFakeTimers();
    await app.reload();
    expect(app.toJSON()).toMatchInlineSnapshot(
      {
        $created: expect.stringMatching(ISODateTimePattern),
        $updated: expect.stringMatching(ISODateTimePattern),
        iconUrl: expect.any(String),
      },
      `
      {
        "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
        "OrganizationId": "testorganization",
        "OrganizationName": undefined,
        "controllerCode": null,
        "controllerImplementations": null,
        "coreStyle": ".tux{color:rgb(1 2 3)}",
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
          "resources": {
            "test": {
              "schema": {
                "additionalProperties": false,
                "properties": {
                  "tux": {
                    "format": "binary",
                    "type": "string",
                  },
                },
                "type": "object",
              },
            },
          },
        },
        "demoMode": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasClonableAssets": undefined,
        "hasClonableResources": undefined,
        "hasIcon": true,
        "hasMaskableIcon": true,
        "iconBackground": "#ffffff",
        "iconUrl": Any<String>,
        "id": 1,
        "locked": "unlocked",
        "messages": undefined,
        "path": "test-app",
        "rating": undefined,
        "readmeUrl": undefined,
        "screenshotUrls": undefined,
        "sentryDsn": null,
        "sentryEnvironment": null,
        "sharedStyle": ".tux{color:rgb(1 2 3)}",
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      resources:
        test:
          schema:
            additionalProperties: false
            type: object
            properties:
              tux:
                type: string
                format: binary
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
      ",
      }
    `,
    );
    expect(app.icon).toStrictEqual(await readFixture('apps/test/variants/tux/icon.png'));
    // TODO: not supported yet
    // expect(app.maskableIcon).toStrictEqual(
    //   await readFixture('apps/test/variants/tux/maskable-icon.png'),
    // );
    const appBlockStyle = await AppBlockStyle.findOne();
    expect(appBlockStyle.style).toBe('.tux{color:rgb(1 2 3)}');
    const appScreenshot = await AppScreenshot.findOne();
    expect(appScreenshot.screenshot).toStrictEqual(
      await readFixture('apps/test/variants/tux/screenshots/tux.png'),
    );
    const appMessages = await AppMessages.findAll({ order: [['language', 'DESC']] });
    const messages = JSON.parse(
      String(await readFixture('apps/test/variants/tux/patches/messages.json')),
    );
    expect(appMessages.map(({ language, messages: msgs }) => [language, msgs])).toStrictEqual([
      ['nl', messages.nl],
      ['en', messages.en],
    ]);
    const resources = await Resource.findAll();
    expect(resources.map((r) => r.toJSON())).toMatchInlineSnapshot(
      [
        {
          $created: expect.stringMatching(ISODateTimePattern),
          $updated: expect.stringMatching(ISODateTimePattern),
        },
      ],
      `
      [
        {
          "$created": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "$updated": StringMatching /\\\\d\\{4\\}\\(\\.\\\\d\\{2\\}\\)\\{2\\}\\(\\\\s\\|T\\)\\(\\\\d\\{2\\}\\.\\)\\{2\\}\\\\d\\{2\\}/,
          "id": 1,
          "tux": "small-tux",
        },
      ]
    `,
    );
    const assets = await Asset.findAll();
    expect(assets.map((a) => a.data)).toStrictEqual([
      await readFixture('apps/test/variants/tux/assets/small-tux.png'),
    ]);
  });
});

describe('patchApp', () => {
  it('should apply patches to app', async () => {
    const patches = {
      demoMode: true,
      enableSelfRegistration: true,
      iconBackground: '#FFFFFF',
      locked: 'fullLock',
      path: 'updated-path',
      showAppDefinition: true,
      showAppsembleLogin: true,
      showAppsembleOAuth2Login: true,
      template: true,
      visibility: 'private',
    } as Partial<typeof App>;
    const app = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
      },
      { raw: true },
    );
    await authorizeCLI('apps:write');
    await patchApp({
      ...patches,
      remote: testApp.defaults.baseURL,
      id: app.id,
    });
    await app.reload();
    expect(app.dataValues).toStrictEqual(
      expect.objectContaining({ ...app.dataValues, ...patches }),
    );
    expect(app.dataValues).toMatchInlineSnapshot(`
      {
        "OrganizationId": "testorganization",
        "controllerCode": null,
        "controllerImplementations": null,
        "coreStyle": null,
        "created": 1970-01-01T00:00:00.000Z,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "deleted": null,
        "demoMode": true,
        "domain": null,
        "emailHost": null,
        "emailName": null,
        "emailPassword": null,
        "emailPort": 587,
        "emailSecure": true,
        "emailUser": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "icon": null,
        "iconBackground": "#FFFFFF",
        "id": 1,
        "locked": "fullLock",
        "maskableIcon": null,
        "path": "updated-path",
        "scimEnabled": false,
        "scimToken": null,
        "sentryDsn": null,
        "sentryEnvironment": null,
        "sharedStyle": null,
        "showAppDefinition": true,
        "showAppsembleLogin": true,
        "showAppsembleOAuth2Login": true,
        "sslCertificate": null,
        "sslKey": null,
        "template": true,
        "updated": 1970-01-01T00:00:00.000Z,
        "vapidPrivateKey": "b",
        "vapidPublicKey": "a",
        "visibility": "private",
      }
    `);
  });

  it.each`
    key                           | from          | to
    ${'demoMode'}                 | ${false}      | ${true}
    ${'demoMode'}                 | ${true}       | ${false}
    ${'enableSelfRegistration'}   | ${false}      | ${true}
    ${'enableSelfRegistration'}   | ${true}       | ${false}
    ${'iconBackground'}           | ${''}         | ${'#FFFFFF'}
    ${'path'}                     | ${'before'}   | ${'after'}
    ${'locked'}                   | ${'unlocked'} | ${'studioLock'}
    ${'locked'}                   | ${'unlocked'} | ${'fullLock'}
    ${'locked'}                   | ${'fullLock'} | ${'unlocked'}
    ${'showAppDefinition'}        | ${false}      | ${true}
    ${'showAppDefinition'}        | ${true}       | ${false}
    ${'showAppsembleLogin'}       | ${false}      | ${true}
    ${'showAppsembleLogin'}       | ${true}       | ${false}
    ${'showAppsembleOAuth2Login'} | ${false}      | ${true}
    ${'showAppsembleOAuth2Login'} | ${true}       | ${false}
    ${'template'}                 | ${false}      | ${true}
    ${'template'}                 | ${true}       | ${false}
    ${'visibility'}               | ${'public'}   | ${'unlisted'}
    ${'visibility'}               | ${'public'}   | ${'private'}
    ${'visibility'}               | ${'private'}  | ${'public'}
  `('should patch $key from `$from` to `$to`', async ({ from, key, to }) => {
    const app = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
        [key]: from,
      },
      { raw: true },
    );
    await authorizeCLI('apps:write');
    await patchApp({
      [key]: to,
      remote: testApp.defaults.baseURL,
      id: app.id,
    });
    expect(app.dataValues[key]).toStrictEqual(from);
    await app.reload();
    expect(app.dataValues[key]).toStrictEqual(to);
  });
});

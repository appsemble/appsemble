import { writeFile } from 'node:fs/promises';

import { getS3FileBuffer, readFixture, resolveFixture } from '@appsemble/node-utils';
import { createServer, createTestUser, models, setArgv } from '@appsemble/server';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { ISODateTimePattern } from '@appsemble/utils';
import { type AxiosTestInstance, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteApp,
  patchApp,
  publishApp,
  resolveAppIdAndRemote,
  traverseAppDirectory,
  updateApp,
  writeAppMessages,
} from './app.js';
import { initAxios } from './initAxios.js';
import { authorizeCLI } from './testUtils.js';

const {
  App,
  AppBlockStyle,
  AppCollection,
  AppCollectionApp,
  AppMessages,
  AppOAuth2Secret,
  AppSamlSecret,
  AppScreenshot,
  AppServiceSecret,
  AppVariable,
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

describe('app', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    setArgv(argv);
  });

  beforeEach(async () => {
    vi.clearAllTimers();
    vi.setSystemTime(0);
    const server = await createServer();
    testApp = await setTestApp(server);
    initAxios({ remote: testApp.defaults.baseURL! });
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

  describe('publishApp', () => {
    it('should publish app', async () => {
      vi.useRealTimers();
      const clientCredentials = await authorizeCLI('apps:write resources:write', testApp);
      await publishApp({
        path: resolveFixture('apps/test'),
        organization: organization.id,
        remote: testApp.defaults.baseURL!,
        clientCredentials,
        // Required defaults
        visibility: 'unlisted',
        iconBackground: '#ffffff',
      });
      vi.useFakeTimers();
      const app = (await App.findOne())!;
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
          "displayAppMemberName": false,
          "displayInstallationPrompt": false,
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
          "skipGroupInvites": false,
          "template": false,
          "version": -1,
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
      const appBlockStyle = (await AppBlockStyle.findOne())!;
      expect(appBlockStyle.style).toBe(`.tux {
  color: rgb(0 0 0);
}`);
      const appScreenshot = (await AppScreenshot.findOne())!;
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

    it('should throw an error if the user doesn’t have enough scope permissions', async () => {
      const clientCredentials = await authorizeCLI('', testApp);
      vi.useRealTimers();
      await expect(() =>
        publishApp({
          path: resolveFixture('apps/test'),
          organization: organization.id,
          remote: testApp.defaults.baseURL!,
          clientCredentials,
          // Required defaults
          visibility: 'unlisted',
          iconBackground: '#ffffff',
        }),
      ).rejects.toThrow('Request failed with status code 401');
      vi.useFakeTimers();
      const app = await App.findOne();
      expect(app).toBeNull();
    });

    it('should not publish if dryRun is specified', async () => {
      const clientCredentials = await authorizeCLI('apps:write resources:write', testApp);
      await publishApp({
        path: resolveFixture('apps/test'),
        organization: organization.id,
        remote: testApp.defaults.baseURL!,
        clientCredentials,
        // Required defaults
        visibility: 'unlisted',
        iconBackground: '#ffffff',
        dryRun: true,
      });
      const apps = await App.findAll();
      expect(apps).toStrictEqual([]);
    });

    it('should publish app with resources and assets', async () => {
      vi.useRealTimers();
      const clientCredentials = await authorizeCLI(
        'apps:write resources:write assets:write',
        testApp,
      );
      await publishApp({
        path: resolveFixture('apps/test'),
        organization: organization.id,
        remote: testApp.defaults.baseURL!,
        clientCredentials,
        // Required defaults
        visibility: 'unlisted',
        iconBackground: '#ffffff',
        // Additional
        resources: true,
        assets: true,
      });
      vi.useFakeTimers();
      const app = (await App.findOne())!;
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
          "displayAppMemberName": false,
          "displayInstallationPrompt": false,
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
          "skipGroupInvites": false,
          "template": false,
          "version": -1,
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
      const appBlockStyle = (await AppBlockStyle.findOne())!;
      expect(appBlockStyle.style).toBe(`.tux {
  color: rgb(0 0 0);
}`);
      const appScreenshot = (await AppScreenshot.findOne())!;
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
      const assets = await Asset.findAll({ order: [['filename', 'ASC']] });
      const tuxData = await readFixture('apps/test/assets/tux.png');
      expect(
        await Promise.all(assets.map((a) => getS3FileBuffer(`app-${app.id}`, a.id))),
      ).toStrictEqual([await sharp(tuxData).toFormat('avif').toBuffer()]);
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
      const clientCredentials = await authorizeCLI(
        'apps:write resources:write assets:write',
        testApp,
      );
      await publishApp({
        path: resolveFixture('apps/test'),
        organization: organization.id,
        remote: testApp.defaults.baseURL!,
        clientCredentials,
        // Required defaults
        visibility: 'unlisted',
        iconBackground: '#ffffff',
        // Define context
        context: 'test',
      });
      vi.useFakeTimers();
      const app = (await App.findOne())!;
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
          "displayAppMemberName": false,
          "displayInstallationPrompt": false,
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
          "skipGroupInvites": false,
          "template": true,
          "version": -1,
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
      const appBlockStyle = (await AppBlockStyle.findOne())!;
      expect(appBlockStyle.style).toBe(`.tux {
  color: rgb(0 0 0);
}`);
      const appScreenshot = (await AppScreenshot.findOne())!;
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
      const assets = await Asset.findAll({ order: [['filename', 'ASC']] });
      const tuxData = await readFixture('apps/test/assets/tux.png');
      const tuxAvifData = await sharp(tuxData).toFormat('avif').toBuffer();
      expect(
        await Promise.all(assets.map((a) => getS3FileBuffer(`app-${app.id}`, a.id))),
      ).toStrictEqual([tuxAvifData, tuxAvifData]);
      const appCollectionApp = (await AppCollectionApp.findOne())!;
      expect(appCollectionApp.AppId).toBe(1);
      expect(appCollectionApp.AppCollectionId).toBe(1);
    });

    it('should publish app with app variant patches applied', async () => {
      vi.useRealTimers();
      const clientCredentials = await authorizeCLI(
        'apps:write resources:write assets:write',
        testApp,
      );
      await publishApp({
        path: resolveFixture('apps/test'),
        organization: organization.id,
        remote: testApp.defaults.baseURL!,
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
      const app = (await App.findOne())!;
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
          "displayAppMemberName": false,
          "displayInstallationPrompt": false,
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
          "skipGroupInvites": false,
          "template": false,
          "version": -1,
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
      expect(app.maskableIcon).toStrictEqual(
        await readFixture('apps/test/variants/tux/maskable-icon.png'),
      );
      const appBlockStyle = (await AppBlockStyle.findOne())!;
      expect(appBlockStyle.style).toBe('.tux{color:rgb(1 2 3)}');
      const appScreenshot = (await AppScreenshot.findOne())!;
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
      const assets = await Asset.findAll({ order: [['filename', 'ASC']] });
      const tuxData = await readFixture('apps/test/variants/tux/assets/small-tux.png');
      expect(
        await Promise.all(assets.map((a) => getS3FileBuffer(`app-${app.id}`, a.id))),
      ).toStrictEqual([await sharp(tuxData).toFormat('avif').toBuffer()]);
    });

    it('should publish app variables and secrets', async () => {
      vi.useRealTimers();
      const clientCredentials = await authorizeCLI('apps:write resources:write', testApp);
      process.env.TEST_VARIABLE_1 = 'test-variable-1';
      process.env.TEST_VARIABLE_2 = 'test-variable-2';

      process.env.TEST_SECRET = 'test-secret';

      process.env.TEST_SERVICE_URL_PATTERNS = 'http://localhost:1234';
      process.env.TEST_SERVICE_IDENTIFIER = 'Authorization';
      process.env.TEST_SERVICE_SECRET = 'secret';

      process.env.TEST_SAML_IDP_CERTIFICATE = 'certificate';
      process.env.TEST_SAML_ENTITY_ID = 'http://localhost:1234';
      process.env.TEST_SAML_SSO_URL = 'http://localhost:1234';

      process.env.TEST_OAUTH2_AUTHORIZATION_URL = 'http://localhost:1234';
      process.env.TEST_OAUTH2_TOKEN_URL = 'http://localhost:1234';
      process.env.TEST_OAUTH2_USER_INFO_URL = 'http://localhost:1234';
      process.env.TEST_OAUTH2_CLIENT_ID = 'id';
      process.env.TEST_OAUTH2_CLIENT_SECRET = 'secret';

      process.env.TEST_SCIM_TOKEN = 'token';

      process.env.TEST_SSL_KEY = 'key';
      process.env.TEST_SSL_CERTIFICATE = 'certificate';

      await publishApp({
        path: resolveFixture('apps/test'),
        organization: organization.id,
        remote: testApp.defaults.baseURL!,
        clientCredentials,
        visibility: 'unlisted',
        iconBackground: '#ffffff',
      });

      vi.useFakeTimers();

      const app = (await App.findOne({
        attributes: ['scimEnabled', 'scimToken', 'sslKey', 'sslCertificate'],
        where: {
          id: 1,
        },
      }))!;

      expect({
        scimEnabled: app.scimEnabled,
        scimToken: app.scimToken,
        sslKey: app.sslKey,
        sslCertificate: app.sslCertificate,
      }).toStrictEqual({
        scimEnabled: true,
        scimToken: expect.any(Buffer),
        sslKey: 'key',
        sslCertificate: 'certificate',
      });

      const appVariables = await AppVariable.findAll({
        attributes: ['name', 'value'],
        where: {
          AppId: 1,
        },
      });

      expect(appVariables[0].toJSON()).toStrictEqual({
        name: 'test-variable-inline',
        value: 'inline',
      });

      expect(appVariables[1].toJSON()).toStrictEqual({
        name: 'test-variable',
        value: 'test-variable-1.test-variable-2',
      });

      const appServiceSecret = (await AppServiceSecret.findOne({
        attributes: ['name', 'authenticationMethod', 'urlPatterns', 'identifier', 'secret'],
        where: {
          AppId: 1,
        },
      }))!;

      expect(appServiceSecret.toJSON()).toStrictEqual({
        name: 'test-service-secret',
        authenticationMethod: 'custom-header',
        urlPatterns: 'http://localhost:1234',
        identifier: 'Authorization',
        secret: expect.any(Buffer),
      });

      const appSamlSecret = (await AppSamlSecret.findOne({
        attributes: [
          'name',
          'icon',
          'nameAttribute',
          'emailAttribute',
          'idpCertificate',
          'entityId',
          'ssoUrl',
        ],
        where: {
          AppId: 1,
        },
      }))!;

      expect(appSamlSecret.toJSON()).toStrictEqual({
        emailAttribute: 'email',
        emailVerifiedAttribute: null,
        entityId: 'http://localhost:1234',
        icon: 'redhat',
        id: 1,
        idpCertificate: 'certificate',
        name: 'test-saml-secret',
        nameAttribute: 'name',
        ssoUrl: 'http://localhost:1234',
        spCertificate: expect.any(String),
      });

      const appOauth2Secret = (await AppOAuth2Secret.findOne({
        attributes: [
          'name',
          'icon',
          'scope',
          'remapper',
          'authorizationUrl',
          'tokenUrl',
          'userInfoUrl',
          'clientId',
          'clientSecret',
        ],
        where: {
          AppId: 1,
        },
      }))!;

      expect({
        authorizationUrl: appOauth2Secret.authorizationUrl,
        clientId: appOauth2Secret.clientId,
        clientSecret: appOauth2Secret.clientSecret,
        icon: appOauth2Secret.icon,
        name: appOauth2Secret.name,
        remapper: appOauth2Secret.remapper,
        scope: appOauth2Secret.scope,
        tokenUrl: appOauth2Secret.tokenUrl,
        userInfoUrl: appOauth2Secret.userInfoUrl,
      }).toStrictEqual({
        authorizationUrl: 'http://localhost:1234',
        clientId: 'id',
        clientSecret: 'secret',
        icon: 'redhat',
        name: 'test-oauth2-secret',
        remapper: [{ prop: 'email' }],
        scope: 'email openid profile',
        tokenUrl: 'http://localhost:1234',
        userInfoUrl: 'http://localhost:1234',
      });
    });

    it('should validate and throw if there’s an error before publishing an app', async () => {
      await BlockVersion.destroy({
        where: {
          version: '0.0.0',
          OrganizationId: 'appsemble',
          name: 'test',
        },
      });
      vi.useRealTimers();
      const clientCredentials = await authorizeCLI('apps:write resources:write', testApp);
      await expect(() =>
        publishApp({
          path: resolveFixture('apps/test'),
          organization: organization.id,
          remote: testApp.defaults.baseURL!,
          clientCredentials,
          // Required defaults
          visibility: 'unlisted',
          iconBackground: '#ffffff',
        }),
      ).rejects.toThrow('is not a known block type');
      const app = await App.findOne();
      expect(app).toBeNull();
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
      const clientCredentials = await authorizeCLI('apps:write resources:write', testApp);
      await updateApp({
        id: app.id,
        path: resolveFixture('apps/test'),
        remote: testApp.defaults.baseURL!,
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
          "displayAppMemberName": false,
          "displayInstallationPrompt": false,
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
          "skipGroupInvites": false,
          "template": false,
          "version": -1,
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
      const appBlockStyle = (await AppBlockStyle.findOne())!;
      expect(appBlockStyle.style).toBe(`.tux {
  color: rgb(0 0 0);
}`);
      const appScreenshot = (await AppScreenshot.findOne())!;
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

    it('should throw an error if the user doesn’t have enough scope permissions', async () => {
      const clientCredentials = await authorizeCLI('', testApp);
      vi.useRealTimers();
      await expect(() =>
        updateApp({
          id: app.id,
          force: false,
          path: resolveFixture('apps/test'),
          remote: testApp.defaults.baseURL!,
          clientCredentials,
          // Required defaults
          visibility: 'unlisted',
          iconBackground: '#ffffff',
        }),
      ).rejects.toThrow('Request failed with status code 401');
      vi.useFakeTimers();
      await app.reload();
      expect(app).toMatchObject({
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
      });
    });

    it('should update app with resources and assets', async () => {
      vi.useRealTimers();
      const clientCredentials = await authorizeCLI(
        'apps:write resources:write assets:write',
        testApp,
      );
      await updateApp({
        id: app.id,
        path: resolveFixture('apps/test'),
        remote: testApp.defaults.baseURL!,
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
          "displayAppMemberName": false,
          "displayInstallationPrompt": false,
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
          "skipGroupInvites": false,
          "template": false,
          "version": -1,
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
      const appBlockStyle = (await AppBlockStyle.findOne())!;
      expect(appBlockStyle.style).toBe(`.tux {
  color: rgb(0 0 0);
}`);
      const appScreenshot = (await AppScreenshot.findOne())!;
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
      const assets = await Asset.findAll({ order: [['filename', 'ASC']] });
      const tuxData = await readFixture('apps/test/assets/tux.png');
      expect(
        await Promise.all(assets.map((a) => getS3FileBuffer(`app-${app.id}`, a.id))),
      ).toStrictEqual([await sharp(tuxData).toFormat('avif').toBuffer()]);
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
      const clientCredentials = await authorizeCLI(
        'apps:write resources:write assets:write',
        testApp,
      );
      await updateApp({
        path: resolveFixture('apps/test'),
        id: app.id,
        remote: testApp.defaults.baseURL!,
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
          "displayAppMemberName": false,
          "displayInstallationPrompt": false,
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
          "skipGroupInvites": false,
          "template": true,
          "version": -1,
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
      const appBlockStyle = (await AppBlockStyle.findOne())!;
      expect(appBlockStyle.style).toBe(`.tux {
  color: rgb(0 0 0);
}`);
      const appScreenshot = (await AppScreenshot.findOne())!;
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
      const assets = await Asset.findAll({ order: [['filename', 'ASC']] });
      const tuxData = await readFixture('apps/test/assets/tux.png');
      const tuxAvifData = await sharp(tuxData).toFormat('avif').toBuffer();
      expect(
        await Promise.all(assets.map((a) => getS3FileBuffer(`app-${app.id}`, a.id))),
      ).toStrictEqual([tuxAvifData, tuxAvifData]);
      // TODO: not yet implemented
      // const appCollectionApp = await AppCollectionApp.findOne();
      // expect(appCollectionApp.AppId).toBe(1);
      // expect(appCollectionApp.AppCollectionId).toBe(1);
    });

    it('should update app with app variant patches applied', async () => {
      vi.useRealTimers();
      const clientCredentials = await authorizeCLI(
        'apps:write resources:write assets:write',
        testApp,
      );
      await updateApp({
        path: resolveFixture('apps/test'),
        id: app.id,
        remote: testApp.defaults.baseURL!,
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
          "displayAppMemberName": false,
          "displayInstallationPrompt": false,
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
          "skipGroupInvites": false,
          "template": false,
          "version": -1,
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
      expect(app.maskableIcon).toStrictEqual(
        await readFixture('apps/test/variants/tux/maskable-icon.png'),
      );
      const appBlockStyle = (await AppBlockStyle.findOne())!;
      expect(appBlockStyle.style).toBe('.tux{color:rgb(1 2 3)}');
      const appScreenshot = (await AppScreenshot.findOne())!;
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
      expect(assets.map((a) => a.filename)).toStrictEqual(['small-tux.avif']);
    });

    it('should update app variables and secrets', async () => {
      vi.useRealTimers();
      const clientCredentials = await authorizeCLI('apps:write resources:write', testApp);
      process.env.TEST_VARIABLE_1 = 'test-variable-1';
      process.env.TEST_VARIABLE_2 = 'test-variable-2';

      process.env.TEST_SECRET = 'test-secret';

      process.env.TEST_SERVICE_URL_PATTERNS = 'http://localhost:1234';
      process.env.TEST_SERVICE_IDENTIFIER = 'Authorization';
      process.env.TEST_SERVICE_SECRET = 'secret';

      process.env.TEST_SAML_IDP_CERTIFICATE = 'certificate';
      process.env.TEST_SAML_ENTITY_ID = 'http://localhost:1234';
      process.env.TEST_SAML_SSO_URL = 'http://localhost:1234';

      process.env.TEST_OAUTH2_AUTHORIZATION_URL = 'http://localhost:1234';
      process.env.TEST_OAUTH2_TOKEN_URL = 'http://localhost:1234';
      process.env.TEST_OAUTH2_USER_INFO_URL = 'http://localhost:1234';
      process.env.TEST_OAUTH2_CLIENT_ID = 'id';
      process.env.TEST_OAUTH2_CLIENT_SECRET = 'secret';

      process.env.TEST_SCIM_TOKEN = 'token';

      process.env.TEST_SSL_KEY = 'key';
      process.env.TEST_SSL_CERTIFICATE = 'certificate';

      await updateApp({
        id: 1,
        path: resolveFixture('apps/test'),
        remote: testApp.defaults.baseURL!,
        clientCredentials,
        visibility: 'unlisted',
        iconBackground: '#ffffff',
        force: true,
      });

      vi.useFakeTimers();

      const updatedApp = (await App.findOne({
        attributes: ['scimEnabled', 'scimToken', 'sslKey', 'sslCertificate'],
        where: {
          id: 1,
        },
      }))!;

      expect({
        scimEnabled: updatedApp.scimEnabled,
        scimToken: updatedApp.scimToken,
        sslKey: updatedApp.sslKey,
        sslCertificate: updatedApp.sslCertificate,
      }).toStrictEqual({
        scimEnabled: true,
        scimToken: expect.any(Buffer),
        sslKey: 'key',
        sslCertificate: 'certificate',
      });

      const appVariables = await AppVariable.findAll({
        attributes: ['name', 'value'],
        where: {
          AppId: 1,
        },
      });

      expect(appVariables[0].toJSON()).toStrictEqual({
        name: 'test-variable-inline',
        value: 'inline',
      });

      expect(appVariables[1].toJSON()).toStrictEqual({
        name: 'test-variable',
        value: 'test-variable-1.test-variable-2',
      });

      const appServiceSecret = (await AppServiceSecret.findOne({
        attributes: ['name', 'authenticationMethod', 'urlPatterns', 'identifier', 'secret'],
        where: {
          AppId: 1,
        },
      }))!;

      expect(appServiceSecret.toJSON()).toStrictEqual({
        name: 'test-service-secret',
        authenticationMethod: 'custom-header',
        urlPatterns: 'http://localhost:1234',
        identifier: 'Authorization',
        secret: expect.any(Buffer),
      });

      const appSamlSecret = (await AppSamlSecret.findOne({
        attributes: [
          'name',
          'icon',
          'nameAttribute',
          'emailAttribute',
          'idpCertificate',
          'entityId',
          'ssoUrl',
        ],
        where: {
          AppId: 1,
        },
      }))!;

      expect(appSamlSecret.toJSON()).toStrictEqual({
        emailAttribute: 'email',
        emailVerifiedAttribute: null,
        entityId: 'http://localhost:1234',
        icon: 'redhat',
        id: 1,
        idpCertificate: 'certificate',
        name: 'test-saml-secret',
        nameAttribute: 'name',
        ssoUrl: 'http://localhost:1234',
        spCertificate: expect.any(String),
      });

      const appOauth2Secret = (await AppOAuth2Secret.findOne({
        attributes: [
          'name',
          'icon',
          'scope',
          'remapper',
          'authorizationUrl',
          'tokenUrl',
          'userInfoUrl',
          'clientId',
          'clientSecret',
        ],
        where: {
          AppId: 1,
        },
      }))!;

      expect({
        authorizationUrl: appOauth2Secret.authorizationUrl,
        clientId: appOauth2Secret.clientId,
        clientSecret: appOauth2Secret.clientSecret,
        icon: appOauth2Secret.icon,
        name: appOauth2Secret.name,
        remapper: appOauth2Secret.remapper,
        scope: appOauth2Secret.scope,
        tokenUrl: appOauth2Secret.tokenUrl,
        userInfoUrl: appOauth2Secret.userInfoUrl,
      }).toStrictEqual({
        authorizationUrl: 'http://localhost:1234',
        clientId: 'id',
        clientSecret: 'secret',
        icon: 'redhat',
        name: 'test-oauth2-secret',
        remapper: [{ prop: 'email' }],
        scope: 'email openid profile',
        tokenUrl: 'http://localhost:1234',
        userInfoUrl: 'http://localhost:1234',
      });
    });

    it('should update an app with `app.locked` set to `fullLock` if force is specified', async () => {
      await app.update({ locked: 'fullLock' });
      const clientCredentials = await authorizeCLI('apps:write', testApp);
      await updateApp({
        path: resolveFixture('apps/test'),
        force: true,
        remote: testApp.defaults.baseURL!,
        id: app.id,
        clientCredentials,
        visibility: 'public',
        iconBackground: '#fff999',
      });
      await app.reload();
      expect(app).toMatchInlineSnapshot(`
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
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
          "displayAppMemberName": false,
          "displayInstallationPrompt": false,
          "domain": null,
          "emailName": null,
          "enableSelfRegistration": true,
          "enableUnsecuredServiceSecrets": false,
          "googleAnalyticsID": null,
          "hasClonableAssets": undefined,
          "hasClonableResources": undefined,
          "hasIcon": true,
          "hasMaskableIcon": true,
          "iconBackground": "#fff999",
          "iconUrl": "/api/apps/1/icon?maskable=true&updated=1970-01-01T00%3A00%3A00.000Z",
          "id": 1,
          "locked": "fullLock",
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
          "skipGroupInvites": false,
          "template": false,
          "version": -1,
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
      `);
    });

    it('should not update an app if the `app.locked` is set to `fullLock`', async () => {
      await app.update({ locked: 'fullLock' });
      const clientCredentials = await authorizeCLI('apps:write', testApp);
      await expect(
        updateApp({
          path: resolveFixture('apps/test'),
          force: false,
          remote: testApp.defaults.baseURL!,
          id: app.id,
          clientCredentials,
          visibility: 'public',
          iconBackground: '#fff999',
        }),
      ).rejects.toThrow('Request failed with status code 403');
      await app.reload();
      expect(app).toMatchInlineSnapshot(`
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": undefined,
          "controllerCode": null,
          "controllerImplementations": null,
          "coreStyle": undefined,
          "definition": {
            "defaultPage": "Test Page",
            "name": "Test App",
          },
          "demoMode": false,
          "displayAppMemberName": false,
          "displayInstallationPrompt": false,
          "domain": null,
          "emailName": null,
          "enableSelfRegistration": true,
          "enableUnsecuredServiceSecrets": false,
          "googleAnalyticsID": null,
          "hasClonableAssets": undefined,
          "hasClonableResources": undefined,
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 1,
          "locked": "fullLock",
          "messages": undefined,
          "path": "test-app",
          "rating": undefined,
          "readmeUrl": undefined,
          "screenshotUrls": undefined,
          "sentryDsn": null,
          "sentryEnvironment": null,
          "sharedStyle": undefined,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "skipGroupInvites": false,
          "template": false,
          "version": -1,
          "visibility": "public",
          "yaml": "name: Test App
        defaultPage: Test Page
        ",
        }
      `);
    });

    it('should validate and throw if there’s an error before updating an app', async () => {
      await BlockVersion.destroy({
        where: {
          version: '0.0.0',
          OrganizationId: 'appsemble',
          name: 'test',
        },
      });
      vi.useRealTimers();
      const clientCredentials = await authorizeCLI('apps:write resources:write', testApp);
      await expect(
        updateApp({
          path: resolveFixture('apps/test'),
          id: app.id,
          force: false,
          remote: testApp.defaults.baseURL!,
          clientCredentials,
          // Required defaults
          visibility: 'unlisted',
          iconBackground: '#ffffff',
        }),
      ).rejects.toThrow('is not a known block type');
      vi.useFakeTimers();
      await app.reload();
      expect(app.dataValues).toMatchInlineSnapshot(`
        {
          "OrganizationId": "testorganization",
          "containers": null,
          "controllerCode": null,
          "controllerImplementations": null,
          "coreStyle": null,
          "created": 1970-01-01T00:00:00.000Z,
          "definition": {
            "defaultPage": "Test Page",
            "name": "Test App",
          },
          "deleted": null,
          "demoMode": false,
          "displayAppMemberName": false,
          "displayInstallationPrompt": false,
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
          "iconBackground": null,
          "id": 1,
          "locked": "unlocked",
          "maskableIcon": null,
          "path": "test-app",
          "registry": null,
          "scimEnabled": false,
          "scimToken": null,
          "sentryDsn": null,
          "sentryEnvironment": null,
          "sharedStyle": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "skipGroupInvites": false,
          "sslCertificate": null,
          "sslKey": null,
          "template": false,
          "updated": 1970-01-01T00:00:00.000Z,
          "vapidPrivateKey": "b",
          "vapidPublicKey": "a",
          "visibility": "public",
        }
      `);
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
      await authorizeCLI('apps:write', testApp);
      await patchApp({
        ...patches,
        remote: testApp.defaults.baseURL!,
        id: app.id,
      });
      await app.reload();
      expect(app.dataValues).toStrictEqual(
        expect.objectContaining({ ...app.dataValues, ...patches }),
      );
      expect(app.dataValues).toMatchInlineSnapshot(`
        {
          "OrganizationId": "testorganization",
          "containers": null,
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
          "displayAppMemberName": false,
          "displayInstallationPrompt": false,
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
          "registry": null,
          "scimEnabled": false,
          "scimToken": null,
          "sentryDsn": null,
          "sentryEnvironment": null,
          "sharedStyle": null,
          "showAppDefinition": true,
          "showAppsembleLogin": true,
          "showAppsembleOAuth2Login": true,
          "skipGroupInvites": false,
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
      await authorizeCLI('apps:write', testApp);
      await patchApp({
        [key]: to,
        remote: testApp.defaults.baseURL!,
        id: app.id,
      });
      expect(app.dataValues[key]).toStrictEqual(from);
      await app.reload();
      expect(app.dataValues[key]).toStrictEqual(to);
    });

    it('should not apply a patch if the `app.locked` is set to `fullLock`', async () => {
      const app = await App.create(
        {
          path: 'test-app',
          definition: { name: 'Test App', defaultPage: 'Test Page' },
          vapidPublicKey: 'a',
          vapidPrivateKey: 'b',
          visibility: 'public',
          OrganizationId: organization.id,
          locked: 'fullLock',
          showAppDefinition: false,
        },
        { raw: true },
      );
      await authorizeCLI('apps:write', testApp);
      await patchApp({
        remote: testApp.defaults.baseURL!,
        id: app.id,
        showAppDefinition: true,
      });
      expect(app.dataValues.showAppDefinition).toBe(false);
      await app.reload();
      expect(app.dataValues.showAppDefinition).toBe(false);
    });

    it('should apply a patch if the `app.locked` is set to `fullLock` and `force` is specified', async () => {
      const app = await App.create(
        {
          path: 'test-app',
          definition: { name: 'Test App', defaultPage: 'Test Page' },
          vapidPublicKey: 'a',
          vapidPrivateKey: 'b',
          visibility: 'public',
          OrganizationId: organization.id,
          locked: 'fullLock',
          showAppDefinition: false,
        },
        { raw: true },
      );
      await authorizeCLI('apps:write', testApp);
      await patchApp({
        remote: testApp.defaults.baseURL!,
        id: app.id,
        showAppDefinition: true,
        force: true,
      });
      expect(app.dataValues.showAppDefinition).toBe(false);
      await app.reload();
      expect(app.dataValues.showAppDefinition).toBe(true);
    });
  });

  describe('traverseAppDirectory', () => {
    it('should read the app definition and appsembleRC from the directory', async () => {
      const formData = new FormData();
      const [appsembleContext, appsembleRC, yaml, app] = await traverseAppDirectory(
        resolveFixture('apps/test'),
        'test',
        formData,
      );
      expect(appsembleContext).toMatchInlineSnapshot(
        {
          icon: expect.any(String),
          maskableIcon: expect.any(String),
        },
        `
      {
        "appLock": "studioLock",
        "assets": true,
        "assetsClonable": true,
        "collections": [
          1,
        ],
        "demoMode": true,
        "googleAnalyticsId": "test",
        "icon": Any<String>,
        "iconBackground": "#000000",
        "id": 1,
        "maskableIcon": Any<String>,
        "organization": "testorganization",
        "resources": true,
        "sentryDsn": "https://public@sentry.example.com/1",
        "sentryEnvironment": "test",
        "showAppDefinition": true,
        "template": true,
        "visibility": "public",
      }
    `,
      );
      expect(appsembleRC).toMatchInlineSnapshot(
        {
          context: {
            test: {
              icon: expect.any(String),
              maskableIcon: expect.any(String),
            },
          },
        },
        `
      {
        "context": {
          "notFound": {
            "organization": "testorganization",
          },
          "resolve": {
            "id": 5,
            "remote": "http://localhost:5555",
          },
          "test": {
            "appLock": "studioLock",
            "assets": true,
            "assetsClonable": true,
            "collections": [
              1,
            ],
            "demoMode": true,
            "googleAnalyticsId": "test",
            "icon": Any<String>,
            "iconBackground": "#000000",
            "id": 1,
            "maskableIcon": Any<String>,
            "organization": "testorganization",
            "resources": true,
            "sentryDsn": "https://public@sentry.example.com/1",
            "sentryEnvironment": "test",
            "showAppDefinition": true,
            "template": true,
            "visibility": "public",
          },
        },
      }
    `,
      );
      expect(yaml).toMatchInlineSnapshot(`
        "name: Test App
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
        "
      `);
      expect(app).toMatchInlineSnapshot(
        {
          iconUrl: expect.any(String),
        },
        `
      {
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
        "iconUrl": Any<String>,
        "readmeUrl": "README.md",
        "screenshotUrls": [
          "test_en-us.png",
        ],
        "sharedStyle": ".tux {
        color: rgb(0 0 0);
      }
      ",
      }
    `,
      );
    });

    it('should return an error if no app-definition is found in the given directory', async () => {
      const formData = new FormData();
      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
        traverseAppDirectory(resolveFixture('apps/empty'), null, formData),
      ).rejects.toThrow('No app definition found');
    });
  });

  describe('resolveAppIdAndRemote', () => {
    it('should find and return app id and remote from appsembleRC', async () => {
      const [appId, remote] = await resolveAppIdAndRemote(
        resolveFixture('apps/test'),
        'resolve',
        'http://localhost:8888',
        55,
      );
      expect(appId).toBe(5);
      expect(remote).toBe('http://localhost:5555/');
    });

    it('should fallback to default appId and remote if not found in context', async () => {
      const [appId, remote] = await resolveAppIdAndRemote(
        resolveFixture('apps/test'),
        'notFound',
        'http://localhost:8888',
        55,
      );
      expect(appId).toBe(55);
      expect(remote).toBe('http://localhost:8888/');
    });

    it('should throw if the appId is not found in context and defaultAppId is not specified', async () => {
      await expect(() =>
        resolveAppIdAndRemote(
          resolveFixture('apps/test'),
          'notFound',
          'http://localhost:8888',
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          null,
        ),
      ).rejects.toThrow('App ID was not found');
    });

    it('should throw if the remote is not found in context and defaultAppRemote is not specified', async () => {
      const app = await App.create({
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
      });
      await expect(() =>
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        resolveAppIdAndRemote(resolveFixture('apps/test'), 'notFound', null, app.id),
      ).rejects.toThrow('App remote was not found');
    });
  });

  describe('deleteApp', () => {
    it('should throw if an error occurs', async () => {
      const clientCredentials = await authorizeCLI('apps:delete', testApp);
      await expect(() =>
        deleteApp({ id: 1, remote: testApp.defaults.baseURL!, clientCredentials }),
      ).rejects.toThrow('Request failed with status code 404');
    });

    it('should delete an app', async () => {
      const app = await App.create({
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
      });
      const clientCredentials = await authorizeCLI('apps:delete', testApp);
      await deleteApp({ id: app.id, remote: testApp.defaults.baseURL!, clientCredentials });
      const foundApps = await App.findAll();
      expect(foundApps).toStrictEqual([]);
    });
  });

  describe('writeAppMessages', () => {
    it('should extract messages from app-definition and write to file in i18n directory', async () => {
      const initialMessages = JSON.parse(
        String(await readFixture('apps/test-messages/i18n/nl.json')),
      );
      expect(initialMessages).toMatchObject({
        app: {},
      });
      await writeAppMessages(resolveFixture('apps/test-messages'), ['nl'], [], 'json');
      const messages = JSON.parse(String(await readFixture('apps/test-messages/i18n/nl.json')));
      expect(messages).toMatchObject({
        app: {
          description: '',
          name: '',
          'pages.test-page': '',
        },
      });
      await writeFile(
        resolveFixture('apps/test-messages/i18n/nl.json'),
        JSON.stringify(initialMessages, null, '\t'),
      );
    });

    it('should throw if the language file does not exist', async () => {
      await expect(() =>
        writeAppMessages(resolveFixture('apps/test-messages'), ['hr'], [], 'json'),
      ).rejects.toThrow('Missing translations file');
    });

    it('should throw if there are empty messages in a verified file', async () => {
      const initialMessages = JSON.parse(
        String(await readFixture('apps/test-messages/i18n/nl.json')),
      );
      expect(initialMessages).toMatchObject({
        app: {},
      });
      await expect(() =>
        writeAppMessages(resolveFixture('apps/test-messages'), ['nl'], ['nl'], 'json'),
      ).rejects.toThrow('Missing translation');
    });

    it('should throw if app definition does not exist in the app folder', async () => {
      await expect(() =>
        writeAppMessages(resolveFixture('apps/empty'), ['nl'], [], 'json'),
      ).rejects.toThrow('Couldn’t find app definition');
    });
  });
});

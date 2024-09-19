import { readFixture } from '@appsemble/node-utils';
import { type AppDefinition, PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import JSZip from 'jszip';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { stringify } from 'yaml';

import {
  App,
  AppReadme,
  AppScreenshot,
  Asset,
  BlockVersion,
  Organization,
  OrganizationMember,
  Resource,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

let organization: Organization;
let user: User;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

useTestDatabase(import.meta);

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

describe('importApp', () => {
  it('should not allow a user with insufficient permissions to import an App', async () => {
    const appDefinition = {
      name: 'Test App',
      defaultPage: 'Test Page',
      pages: [{ name: 'Test Page', blocks: [{ type: 'test', version: '0.0.0' }] }],
    } as AppDefinition;
    const zip = new JSZip();
    zip.file('app-definition.yaml', stringify(appDefinition));
    vi.useRealTimers();
    const content = zip.generateNodeStream();
    await OrganizationMember.update({ role: 'Member' }, { where: { UserId: user.id } });
    authorizeStudio();

    const response = await request.post(
      `/api/organizations/${organization.id}/apps/import`,
      content,
      {
        headers: {
          'Content-Type': 'application/zip',
        },
      },
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow a user with sufficient permissions to import an App', async () => {
    const appDefinition = {
      name: 'Test App',
      defaultPage: 'Test Page',
      pages: [{ name: 'Test Page', blocks: [{ type: 'test', version: '0.0.0' }] }],
      resources: {
        testResource: {
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          roles: ['$public'],
        },
      },
    } as AppDefinition;
    const zip = new JSZip();
    zip.file('app-definition.yaml', stringify(appDefinition));
    zip.file('icon.png', await readFixture('nodejs-logo.png'));
    zip.file('README.md', 'Default');
    zip.file('README.en.md', 'English');
    zip.file('README.nl.md', 'Dutch');
    zip.file('screenshots/0.png', await readFixture('standing.png'));
    zip.file('screenshots/en/0.png', await readFixture('en-standing.png'));
    zip.file('screenshots/nl/0.png', await readFixture('nl-standing.png'));
    zip.file('resources/testResource.json', Buffer.from('[{"foo":"bar"}]'));
    zip.file('assets/10x50.png', await readFixture('10x50.png'));
    vi.useRealTimers();
    const content = zip.generateNodeStream();
    await OrganizationMember.update({ role: 'AppEditor' }, { where: { UserId: user.id } });
    authorizeStudio();

    const response = await request.post(
      `/api/organizations/${organization.id}/apps/import`,
      content,
      {
        headers: {
          'Content-Type': 'application/zip',
        },
      },
    );

    const resources = await Resource.findAll({
      where: {
        AppId: 1,
      },
    });

    for (const resource of resources) {
      expect(resource.toJSON()).toMatchInlineSnapshot(
        {
          id: 1,
          foo: 'bar',
          $created: expect.any(String),
          $updated: expect.any(String),
        },
        `
        {
          "$created": Any<String>,
          "$updated": Any<String>,
          "foo": "bar",
          "id": 1,
        }
      `,
      );
    }

    const assets = await Asset.findAll({
      attributes: ['AppId', 'data'],
      where: {
        AppId: 1,
      },
    });

    for (const asset of assets) {
      expect(asset.toJSON()).toStrictEqual({
        AppId: 1,
        data: expect.any(Buffer),
      });
    }

    const defaultScreenshot = await AppScreenshot.findOne({
      attributes: ['AppId', 'screenshot', 'language', 'index'],
      where: {
        AppId: 1,
        language: 'unspecified',
      },
    });
    expect(defaultScreenshot?.toJSON()).toStrictEqual({
      AppId: 1,
      screenshot: expect.any(Buffer),
      language: 'unspecified',
      index: 0,
    });

    const enScreenshot = await AppScreenshot.findOne({
      attributes: ['AppId', 'screenshot', 'language', 'index'],
      where: {
        AppId: 1,
        language: 'en',
      },
    });
    expect(enScreenshot?.toJSON()).toStrictEqual({
      AppId: 1,
      screenshot: expect.any(Buffer),
      language: 'en',
      index: 0,
    });

    const nlScreenshot = await AppScreenshot.findOne({
      attributes: ['AppId', 'screenshot', 'language', 'index'],
      where: {
        AppId: 1,
        language: 'nl',
      },
    });
    expect(nlScreenshot?.toJSON()).toStrictEqual({
      AppId: 1,
      screenshot: expect.any(Buffer),
      language: 'nl',
      index: 0,
    });

    const defaultReadme = await AppReadme.findOne({
      attributes: ['AppId', 'file', 'language'],
      where: {
        AppId: 1,
        language: 'unspecified',
      },
    });
    expect(defaultReadme?.toJSON()).toStrictEqual({
      AppId: 1,
      file: Buffer.from('Default'),
      language: 'unspecified',
    });

    const enReadme = await AppReadme.findOne({
      attributes: ['AppId', 'file', 'language'],
      where: {
        AppId: 1,
        language: 'en',
      },
    });
    expect(enReadme.toJSON()).toStrictEqual({
      AppId: 1,
      file: Buffer.from('English'),
      language: 'en',
    });

    const nlReadme = await AppReadme.findOne({
      attributes: ['AppId', 'file', 'language'],
      where: {
        AppId: 1,
        language: 'nl',
      },
    });
    expect(nlReadme.toJSON()).toStrictEqual({
      AppId: 1,
      file: Buffer.from('Dutch'),
      language: 'nl',
    });

    expect(response.status).toBe(201);
    expect(response).toMatchInlineSnapshot(
      {
        data: {
          $created: expect.any(String),
          $updated: expect.any(String),
          iconUrl: expect.any(String),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$created": Any<String>,
        "$updated": Any<String>,
        "OrganizationId": "testorganization",
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
          "resources": {
            "testResource": {
              "roles": [
                "$public",
              ],
              "schema": {
                "additionalProperties": false,
                "properties": {
                  "foo": {
                    "type": "string",
                  },
                },
                "required": [
                  "foo",
                ],
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
        "hasIcon": true,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": Any<String>,
        "id": 1,
        "locked": "unlocked",
        "path": "test-app",
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
      resources:
        testResource:
          schema:
            type: object
            additionalProperties: false
            required:
              - foo
            properties:
              foo:
                type: string
          roles:
            - $public
      ",
      }
    `,
    );
    // The faker time is needed for the rest of the tests to pass after using useRealTimers.
    vi.useFakeTimers();
  });

  it('should handle app path conflict on app import.', async () => {
    await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        pages: [{ name: 'Test Page' }],
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const appDefinition = {
      name: 'Test App',
      defaultPage: 'Test Page',
      pages: [{ name: 'Test Page', blocks: [{ type: 'test', version: '0.0.0' }] }],
    } as AppDefinition;
    const zip = new JSZip();
    zip.file('app-definition.yaml', stringify(appDefinition));
    zip.file('icon.png', await readFixture('nodejs-logo.png'));
    zip.file('assets/10x50.png', await readFixture('10x50.png'));
    vi.useRealTimers();
    const content = zip.generateNodeStream();
    await OrganizationMember.update({ role: 'AppEditor' }, { where: { UserId: user.id } });
    authorizeStudio();

    const response = await request.post(
      `/api/organizations/${organization.id}/apps/import`,
      content,
      {
        headers: {
          'Content-Type': 'application/zip',
        },
      },
    );
    expect(response.status).toBe(201);
    expect(response).toMatchInlineSnapshot(
      {
        data: {
          $created: expect.any(String),
          $updated: expect.any(String),
          iconUrl: expect.any(String),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$created": Any<String>,
        "$updated": Any<String>,
        "OrganizationId": "testorganization",
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
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasIcon": true,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": Any<String>,
        "id": 2,
        "locked": "unlocked",
        "path": "test-app-2",
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
        "yaml": "name: Test App
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
    // The faker time is needed for the rest of the tests to pass after using useRealTimers.
    vi.useFakeTimers();
  });
});
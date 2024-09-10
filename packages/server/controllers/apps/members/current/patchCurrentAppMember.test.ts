import { createFixtureStream, createFormData, readFixture } from '@appsemble/node-utils';
import { type AppAccount } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppMember,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

let organization: Organization;
let user: User;

useTestDatabase(import.meta);

beforeAll(async () => {
  vi.useFakeTimers();
  setArgv({ host: 'http://localhost', secret: 'test' });
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
    role: 'Owner',
  });

  await Organization.create({ id: 'appsemble', name: 'Appsemble' });
  await BlockVersion.create({
    name: 'test',
    version: '0.0.0',
    OrganizationId: 'appsemble',
    parameters: {
      properties: {
        type: 'object',
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

describe('patchCurrentAppMember', () => {
  it('should update and return the user’s app account', async () => {
    authorizeStudio();

    const app = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    const appMember = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Member',
    });

    const response = await request.patch(
      `/api/apps/${app.id}/members/current`,
      createFormData({ email: 'user@example.com', name: 'Me', properties: { test: 'Property' } }),
    );

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.stringMatching(uuid4Pattern) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "app": {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "controllerCode": null,
          "controllerImplementations": null,
          "definition": {},
          "demoMode": false,
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
          "path": null,
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "template": false,
          "visibility": "unlisted",
          "yaml": "{}
      ",
        },
        "email": "user@example.com",
        "emailVerified": false,
        "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "name": "Me",
        "picture": "https://www.gravatar.com/avatar/b58996c504c5638798eb6b511e6f49af?s=128&d=mp",
        "properties": {
          "test": "Property",
        },
        "role": "Member",
        "sso": [],
      }
    `,
    );
    await appMember.reload();
    expect(appMember.name).toBe('Me');
    expect(appMember.email).toBe('user@example.com');
  });

  it('should allow for updating the profile picture', async () => {
    authorizeStudio();

    const app = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    const appMember = await AppMember.create({
      email: 'user@example.com',
      AppId: app.id,
      UserId: user.id,
      role: 'Member',
      timezone: 'Europe/Amsterdam',
    });

    const response = await request.patch<AppAccount>(
      `/api/apps/${app.id}/members/current`,
      createFormData({
        email: 'user@example.com',
        name: 'Me',
        picture: createFixtureStream('tux.png'),
      }),
    );

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.stringMatching(uuid4Pattern), picture: expect.any(String) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "app": {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "controllerCode": null,
          "controllerImplementations": null,
          "definition": {},
          "demoMode": false,
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
          "path": null,
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "template": false,
          "visibility": "unlisted",
          "yaml": "{}
      ",
        },
        "email": "user@example.com",
        "emailVerified": false,
        "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "name": "Me",
        "picture": Any<String>,
        "properties": {},
        "role": "Member",
        "sso": [],
      }
    `,
    );
    expect(response.data.picture).toBe(
      `http://localhost/api/common/apps/1/members/${user.id}/picture?updated=0`,
    );
    await appMember.reload();
    expect(appMember.picture).toStrictEqual(await readFixture('tux.png'));
  });

  it('should throw 404 if the app account doesn’t exist', async () => {
    authorizeStudio();

    const app = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });

    const response = await request.patch(
      `/api/apps/${app.id}/members/current`,
      createFormData({ email: 'user@example.com', name: '' }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App account not found",
        "statusCode": 404,
      }
    `);
  });

  it('should throw 404 if the app doesn’t exist', async () => {
    authorizeStudio();

    const response = await request.patch(
      '/api/apps/404/members/current',
      createFormData({ email: 'user@example.com', name: '' }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App account not found",
        "statusCode": 404,
      }
    `);
  });
});

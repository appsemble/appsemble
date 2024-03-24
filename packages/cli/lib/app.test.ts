import { authenticate } from '@appsemble/node-utils';
import {
  authorizeClientCredentials,
  createServer,
  createTestUser,
  models,
  setArgv,
  useTestDatabase,
} from '@appsemble/server';
import { type AxiosTestInstance, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { patchApp } from './app.js';
import { initAxios } from './initAxios.js';

const { App, Organization, OrganizationMember } = models;
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };
let user: models.User;
let organization: models.Organization;
let testApp: AxiosTestInstance;

async function authorizeCLI(scopes: string): Promise<void> {
  const OAuth2AuthorizationCode = await authorizeClientCredentials(scopes);
  const { id, secret } = OAuth2AuthorizationCode;
  await OAuth2AuthorizationCode.update({ secret: await hash(secret, 10) });
  await authenticate(testApp.defaults.baseURL, scopes, `${id}:${secret}`);
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
});

afterAll(() => {
  vi.useRealTimers();
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
        "longDescription": null,
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

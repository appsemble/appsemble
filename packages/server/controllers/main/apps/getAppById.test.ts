import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppSnapshot,
  Organization,
  OrganizationMember,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let user: User;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('getAppById', () => {
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
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should return 404 when fetching a non-existent app', async () => {
    const response = await request.get('/api/apps/1');

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

  it('should fetch an existing app', async () => {
    const appA = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );
    const response = await request.get(`/api/apps/${appA.id}`);

    expect(response).toMatchInlineSnapshot(`
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
        },
        "demoMode": false,
        "displayAppMemberName": false,
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
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
      }
    `);
  });

  it('should fetch an app even if the app definition visibility is false and user is not a member of the organization', async () => {
    const organization2 = await Organization.create({
      id: 'test-org',
      name: 'Test Organization 2',
    });
    const app = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization2.id,
        showAppDefinition: false,
      },
      { raw: true },
    );
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}`);
    expect(response).toMatchObject({
      status: 200,
      data: {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        OrganizationId: organization2.id,
        showAppDefinition: false,
      },
    });
  });

  it('should fetch the most recent snapshot', async () => {
    const app = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    await AppSnapshot.create({ AppId: app.id, yaml: 'name: Test App\ndefaultPage Test Page\n' });
    vi.advanceTimersByTime(3600);
    await AppSnapshot.create({ AppId: app.id, yaml: '{ name: Test App, defaultPage Test Page }' });
    const response = await request.get(`/api/apps/${app.id}`);

    expect(response).toMatchInlineSnapshot(`
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
        },
        "demoMode": false,
        "displayAppMemberName": false,
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
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
      }
    `);
  });

  it('should resolve an icon url for an app with an icon', async () => {
    const app = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
        icon: await readFixture('nodejs-logo.png'),
      },
      { raw: true },
    );
    const response = await request.get(`/api/apps/${app.id}`);
    expect(response).toMatchInlineSnapshot(`
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
        },
        "demoMode": false,
        "displayAppMemberName": false,
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
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
      }
    `);
  });

  it('should resolve an icon url for an app with an organization icon fallback', async () => {
    await organization.update({
      icon: await readFixture('nodejs-logo.png'),
    });

    const app = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );
    const response = await request.get(`/api/apps/${app.id}`);
    expect(response).toMatchInlineSnapshot(`
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
        },
        "demoMode": false,
        "displayAppMemberName": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": "/api/organizations/testorganization/icon?background=%23ffffff&maskable=true&updated=1970-01-01T00%3A00%3A00.000Z",
        "id": 1,
        "locked": "unlocked",
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
      }
    `);
  });

  it('should resolve an icon url for an app without an icon as null', async () => {
    const app = await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );
    const response = await request.get(`/api/apps/${app.id}`);
    expect(response).toMatchInlineSnapshot(`
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
        },
        "demoMode": false,
        "displayAppMemberName": false,
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
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
      }
    `);
  });

  it('should show the app definition of showAppDefinition is true', async () => {
    const app = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      showAppDefinition: true,
    });
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}`);

    expect(response).toMatchInlineSnapshot(`
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
        },
        "demoMode": false,
        "displayAppMemberName": false,
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
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
  });

  it('should show the app yaml for organization members with view permissions', async () => {
    const app = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      showAppDefinition: true,
    });
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}`);

    expect(response).toMatchInlineSnapshot(`
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
        },
        "demoMode": false,
        "displayAppMemberName": false,
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
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
  });
});

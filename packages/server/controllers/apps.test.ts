import { createFixtureStream, createFormData, readFixture } from '@appsemble/node-utils';
import { App as AppType, Snapshot } from '@appsemble/types';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import stripIndent from 'strip-indent';

import {
  App,
  AppBlockStyle,
  AppRating,
  AppScreenshot,
  AppSnapshot,
  BlockAsset,
  BlockMessages,
  BlockVersion,
  Member,
  Organization,
  User,
} from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { encrypt } from '../utils/crypto.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let organization: Organization;
let user: User;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv(argv);
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  import.meta.jest.useFakeTimers({ now: 0 });

  user = await createTestUser();
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });

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

describe('queryApps', () => {
  it('should return an empty array of apps', async () => {
    const response = await request.get('/api/apps');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      []
    `);
  });

  it('should return an array of apps', async () => {
    await App.create(
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
    await App.create(
      {
        path: 'another-app',
        definition: { name: 'Another App', defaultPage: 'Another Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    const response = await request.get('/api/apps');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "definition": {
            "defaultPage": "Test Page",
            "name": "Test App",
          },
          "domain": null,
          "emailName": null,
          "googleAnalyticsID": null,
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 1,
          "locked": false,
          "longDescription": null,
          "path": "test-app",
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "visibility": "public",
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "definition": {
            "defaultPage": "Another Page",
            "name": "Another App",
          },
          "domain": null,
          "emailName": null,
          "googleAnalyticsID": null,
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 2,
          "locked": false,
          "longDescription": null,
          "path": "another-app",
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "visibility": "public",
        },
      ]
    `);
  });

  it('should only include public apps when fetching all apps', async () => {
    await App.create(
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
    await App.create(
      {
        path: 'another-app',
        definition: { name: 'Another App', defaultPage: 'Another Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'unlisted',
        OrganizationId: organization.id,
      },
      { raw: true },
    );
    await App.create(
      {
        path: 'yet-another-app',
        definition: { name: 'Yet Another App', defaultPage: 'Yet Another Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'private',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    const response = await request.get('/api/apps');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "definition": {
            "defaultPage": "Test Page",
            "name": "Test App",
          },
          "domain": null,
          "emailName": null,
          "googleAnalyticsID": null,
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 1,
          "locked": false,
          "longDescription": null,
          "path": "test-app",
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "visibility": "public",
        },
      ]
    `);
  });

  it('should sort apps by its rating', async () => {
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const appA = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      visibility: 'public',
      OrganizationId: organization.id,
    });
    await AppRating.create({
      AppId: appA.id,
      UserId: user.id,
      rating: 5,
      description: 'This is a test rating',
      visibility: 'public',
    });
    await AppRating.create({
      AppId: appA.id,
      UserId: userB.id,
      rating: 4,
      description: 'This is also a test rating',
      visibility: 'public',
    });

    await App.create({
      path: 'another-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      visibility: 'public',
    });

    const appC = await App.create({
      path: 'yet-another-app',
      definition: { name: 'Another App', defaultPage: 'Another Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      visibility: 'public',
    });
    await AppRating.create({
      AppId: appC.id,
      UserId: user.id,
      rating: 3,
      description: 'This is a test rating',
      visibility: 'public',
    });

    const response = await request.get('/api/apps');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "definition": {
            "defaultPage": "Test Page",
            "name": "Test App",
          },
          "domain": null,
          "emailName": null,
          "googleAnalyticsID": null,
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 1,
          "locked": false,
          "longDescription": null,
          "path": "test-app",
          "rating": {
            "average": 4.5,
            "count": 2,
          },
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "visibility": "public",
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "definition": {
            "defaultPage": "Another Page",
            "name": "Another App",
          },
          "domain": null,
          "emailName": null,
          "googleAnalyticsID": null,
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 3,
          "locked": false,
          "longDescription": null,
          "path": "yet-another-app",
          "rating": {
            "average": 3,
            "count": 1,
          },
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "visibility": "public",
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "definition": {
            "defaultPage": "Test Page",
            "name": "Test App",
          },
          "domain": null,
          "emailName": null,
          "googleAnalyticsID": null,
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 2,
          "locked": false,
          "longDescription": null,
          "path": "another-app",
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "visibility": "public",
        },
      ]
    `);
  });
});

describe('getAppById', () => {
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
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": false,
        "longDescription": null,
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "unlisted",
      }
    `);
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
    import.meta.jest.advanceTimersByTime(3600);
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
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": false,
        "longDescription": null,
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
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
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": true,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": "/api/apps/1/icon?maskable=true&updated=1970-01-01T00%3A00%3A00.000Z",
        "id": 1,
        "locked": false,
        "longDescription": null,
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
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
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": "/api/organizations/testorganization/icon?background=%23ffffff&maskable=true&updated=1970-01-01T00%3A00%3A00.000Z",
        "id": 1,
        "locked": false,
        "longDescription": null,
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
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
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": false,
        "longDescription": null,
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
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
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": false,
        "longDescription": null,
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
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
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": false,
        "longDescription": null,
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
  });
});

describe('queryMyApps', () => {
  it('should be able to fetch filtered apps', async () => {
    await App.create(
      {
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    const organizationB = await Organization.create({
      id: 'testorganizationb',
      name: 'Test Organization B',
    });
    await App.create(
      {
        path: 'test-app-b',
        definition: { name: 'Test App B', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organizationB.id,
      },
      { raw: true },
    );

    authorizeStudio();
    const responseA = await request.get('/api/user/apps');

    await Member.create({ OrganizationId: organizationB.id, UserId: user.id, role: 'Member' });

    const responseB = await request.get('/api/user/apps');

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "definition": {
            "defaultPage": "Test Page",
            "name": "Test App",
          },
          "domain": null,
          "emailName": null,
          "googleAnalyticsID": null,
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 1,
          "locked": false,
          "longDescription": null,
          "path": "test-app",
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "visibility": "unlisted",
        },
      ]
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "definition": {
            "defaultPage": "Test Page",
            "name": "Test App",
          },
          "domain": null,
          "emailName": null,
          "googleAnalyticsID": null,
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 1,
          "locked": false,
          "longDescription": null,
          "path": "test-app",
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "visibility": "unlisted",
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganizationb",
          "OrganizationName": "Test Organization B",
          "definition": {
            "defaultPage": "Test Page",
            "name": "Test App B",
          },
          "domain": null,
          "emailName": null,
          "googleAnalyticsID": null,
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 2,
          "locked": false,
          "longDescription": null,
          "path": "test-app-b",
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "visibility": "unlisted",
        },
      ]
    `);
  });
});

describe('createApp', () => {
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
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": true,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": "/api/apps/1/icon?maskable=true&updated=1970-01-01T00%3A00%3A00.000Z",
        "id": 1,
        "locked": false,
        "longDescription": null,
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
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
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": true,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": "/api/apps/1/icon?maskable=true&updated=1970-01-01T00%3A00%3A00.000Z",
        "id": 1,
        "locked": false,
        "longDescription": null,
        "path": "test-app",
        "screenshotUrls": [
          "/api/apps/1/screenshots/1",
        ],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
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

    const screenshot = await AppScreenshot.findOne();
    expect(screenshot.toJSON()).toStrictEqual({
      AppId: 1,
      created: new Date(),
      height: 247,
      id: 1,
      mime: 'image/png',
      screenshot: expect.any(Buffer),
      updated: new Date(),
      width: 474,
    });
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
                "coreStyle": {
                  "description": "The custom style to apply to the core app.",
                  "type": "string",
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
                "longDescription": {
                  "$ref": "#/components/schemas/App/properties/longDescription",
                },
                "maskableIcon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "path": {
                  "$ref": "#/components/schemas/App/properties/path",
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
                "coreStyle": {
                  "description": "The custom style to apply to the core app.",
                  "type": "string",
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
                "longDescription": {
                  "$ref": "#/components/schemas/App/properties/longDescription",
                },
                "maskableIcon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "path": {
                  "$ref": "#/components/schemas/App/properties/path",
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
                "coreStyle": {
                  "description": "The custom style to apply to the core app.",
                  "type": "string",
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
                "longDescription": {
                  "$ref": "#/components/schemas/App/properties/longDescription",
                },
                "maskableIcon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "path": {
                  "$ref": "#/components/schemas/App/properties/path",
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
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not part of this organization.",
        "statusCode": 403,
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
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 2,
        "locked": false,
        "longDescription": null,
        "path": "test-app-2",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
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
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 12,
        "locked": false,
        "longDescription": null,
        "path": StringMatching /test-app-\\(\\\\w\\)\\{10\\}/,
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
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
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": false,
        "longDescription": null,
        "path": "foobar",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": true,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
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
                "coreStyle": {
                  "description": "The custom style to apply to the core app.",
                  "type": "string",
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
                "longDescription": {
                  "$ref": "#/components/schemas/App/properties/longDescription",
                },
                "maskableIcon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "path": {
                  "$ref": "#/components/schemas/App/properties/path",
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
                "coreStyle": {
                  "description": "The custom style to apply to the core app.",
                  "type": "string",
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
                "longDescription": {
                  "$ref": "#/components/schemas/App/properties/longDescription",
                },
                "maskableIcon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "path": {
                  "$ref": "#/components/schemas/App/properties/path",
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
          "domain": null,
          "emailName": null,
          "googleAnalyticsID": null,
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 1,
          "locked": false,
          "longDescription": null,
          "path": "test-app",
          "screenshotUrls": [],
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": true,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
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

      > **Note**: Setting \`notifications\` to \`startup\` is not recommended, due to its invasive nature.
      ",
                    "enum": [
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
                      ],
                    },
                    "minItems": 1,
                    "type": "array",
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
                  "roles": {
                    "description": "The list of roles that are allowed to view this app.

      This list is used as the default roles for the roles property on pages and blocks, which can be
      overridden by defining them for a specific page or block. Note that these roles must be defined in
      \`security.roles\`.
      ",
                    "items": {
                      "type": "string",
                    },
                    "type": "array",
                  },
                  "security": {
                    "$ref": "#/components/schemas/SecurityDefinition",
                    "description": "Role definitions that may be used by the app.",
                  },
                  "theme": {
                    "$ref": "#/components/schemas/Theme",
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
});

describe('patchApp', () => {
  it('should update an app', async () => {
    const app = await App.create(
      {
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        path: 'test-app',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        visibility: 'private',
        yaml: stripIndent(`
          name: Foobar
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
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
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
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": false,
        "longDescription": null,
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "private",
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
  });

  it('should update the email settings', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio(user);
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        emailName: 'Test Email <test@example.com>',
        emailHost: 'smtp.google.com',
        emailUser: 'user',
        emailPassword: 'password',
        emailPort: 123,
        emailSecure: false,
      }),
    );

    const email = await request.get(`/api/apps/${app.id}/email`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "domain": null,
        "emailName": "Test Email <test@example.com>",
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": false,
        "longDescription": null,
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
    expect(email).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "emailHost": "smtp.google.com",
        "emailName": "Test Email <test@example.com>",
        "emailPassword": true,
        "emailPort": 123,
        "emailSecure": false,
        "emailUser": "user",
      }
    `);
  });

  it('should not update a non-existent app', async () => {
    authorizeStudio();
    const response = await request.patch(
      '/api/apps/1',
      createFormData({
        definition: {
          name: 'Foobar',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
      }),
    );

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

  it('should not update an app if it is currently locked', async () => {
    const app = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      locked: true,
    });

    const form = createFormData({
      definition: {
        name: 'Foobar',
        defaultPage: app.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
    });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}`, form);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "App is currently locked.",
        "statusCode": 403,
      }
    `);
  });

  it('should ignore the lock if force is set to true', async () => {
    const app = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      OrganizationName: 'Test Organization',
      locked: true,
    });

    const form = createFormData({
      definition: {
        name: 'Foobar',
        defaultPage: app.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
      force: true,
    });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}`, form);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": true,
        "longDescription": null,
        "path": "bar",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
  });

  it('should update the app domain', async () => {
    const app = await App.create({
      path: 'foo',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({ domain: 'appsemble.app' }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "domain": "appsemble.app",
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": false,
        "longDescription": null,
        "path": "foo",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
  });

  it('should set the app domain to null', async () => {
    const app = await App.create(
      {
        path: 'foo',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}`, createFormData({ domain: '' }));

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": false,
        "longDescription": null,
        "path": "foo",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
  });

  it('should not update an app of another organization', async () => {
    const newOrganization = await Organization.create({ id: 'Test Organization 2' });
    const app = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: newOrganization.id,
    });

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        definition: {
          name: 'Foobar',
          defaultPage: app.definition.defaultPage,
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not part of this organization.",
        "statusCode": 403,
      }
    `);
  });

  it('should validate an app on creation', async () => {
    authorizeStudio();
    const response = await request.post('/api/apps', createFormData({ foo: 'bar' }));

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": "OrganizationId",
            "instance": {
              "foo": "bar",
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
                "coreStyle": {
                  "description": "The custom style to apply to the core app.",
                  "type": "string",
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
                "longDescription": {
                  "$ref": "#/components/schemas/App/properties/longDescription",
                },
                "maskableIcon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "path": {
                  "$ref": "#/components/schemas/App/properties/path",
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
              "foo": "bar",
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
                "coreStyle": {
                  "description": "The custom style to apply to the core app.",
                  "type": "string",
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
                "longDescription": {
                  "$ref": "#/components/schemas/App/properties/longDescription",
                },
                "maskableIcon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "path": {
                  "$ref": "#/components/schemas/App/properties/path",
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

  it('should validate an app on update', async () => {
    const app = await App.create({
      path: 'foo',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        yaml: stripIndent(`
          name: Foo
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
              "argument": "defaultPage",
              "instance": {
                "name": "Foo",
              },
              "message": "requires property "defaultPage"",
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

      > **Note**: Setting \`notifications\` to \`startup\` is not recommended, due to its invasive nature.
      ",
                    "enum": [
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
                      ],
                    },
                    "minItems": 1,
                    "type": "array",
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
                  "roles": {
                    "description": "The list of roles that are allowed to view this app.

      This list is used as the default roles for the roles property on pages and blocks, which can be
      overridden by defining them for a specific page or block. Note that these roles must be defined in
      \`security.roles\`.
      ",
                    "items": {
                      "type": "string",
                    },
                    "type": "array",
                  },
                  "security": {
                    "$ref": "#/components/schemas/SecurityDefinition",
                    "description": "Role definitions that may be used by the app.",
                  },
                  "theme": {
                    "$ref": "#/components/schemas/Theme",
                  },
                },
                "required": [
                  "name",
                  "defaultPage",
                  "pages",
                ],
                "type": "object",
              },
              "stack": "instance requires property "defaultPage"",
            },
            {
              "argument": "pages",
              "instance": {
                "name": "Foo",
              },
              "message": "requires property "pages"",
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

      > **Note**: Setting \`notifications\` to \`startup\` is not recommended, due to its invasive nature.
      ",
                    "enum": [
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
                      ],
                    },
                    "minItems": 1,
                    "type": "array",
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
                  "roles": {
                    "description": "The list of roles that are allowed to view this app.

      This list is used as the default roles for the roles property on pages and blocks, which can be
      overridden by defining them for a specific page or block. Note that these roles must be defined in
      \`security.roles\`.
      ",
                    "items": {
                      "type": "string",
                    },
                    "type": "array",
                  },
                  "security": {
                    "$ref": "#/components/schemas/SecurityDefinition",
                    "description": "Role definitions that may be used by the app.",
                  },
                  "theme": {
                    "$ref": "#/components/schemas/Theme",
                  },
                },
                "required": [
                  "name",
                  "defaultPage",
                  "pages",
                ],
                "type": "object",
              },
              "stack": "instance requires property "pages"",
            },
          ],
        },
        "error": "Bad Request",
        "message": "App validation failed",
        "statusCode": 400,
      }
    `);
  });

  it('should validate and update css when updating an app', async () => {
    const app = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const form = createFormData({
      definition: {
        name: 'Foobar',
        defaultPage: app.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
      coreStyle: 'body { color: yellow; }',
      sharedStyle: 'body { color: blue; }',
    });
    authorizeStudio();
    const response = await request.patch<AppType>(`/api/apps/${app.id}`, form);

    const coreStyle = await request.get(`/api/apps/${response.data.id}/style/core`);
    const sharedStyle = await request.get(`/api/apps/${response.data.id}/style/shared`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "domain": null,
        "emailName": null,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": false,
        "longDescription": null,
        "path": "bar",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
    expect(coreStyle).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/css; charset=utf-8

      body { color: yellow; }
    `);
    expect(sharedStyle).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/css; charset=utf-8

      body { color: blue; }
    `);
  });

  it('should not allow invalid core stylesheets when updating an app', async () => {
    const app = await App.create(
      {
        path: 'bar',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    const formA = createFormData({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        path: 'a',
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
    const responseA = await request.patch(`/api/apps/${app.id}`, formA);

    const formB = createFormData({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        path: 'a',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
    });
    formB.append('coreStyle', '.foo { margin: 0 auto; }', {
      contentType: 'application/json',
      filename: 'style.json',
    });
    authorizeStudio();
    const responseB = await request.patch(`/api/apps/${app.id}`, formB);

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Provided CSS was invalid.",
        "statusCode": 400,
      }
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": "text/css",
            "instance": ".foo { margin: 0 auto; }",
            "message": "has an invalid content type",
            "name": "contentType",
            "path": [
              "coreStyle",
            ],
            "property": "instance.coreStyle",
            "schema": {},
            "stack": "instance has an invalid content type",
          },
        ],
        "message": "Invalid content types found",
      }
    `);
  });

  it('should not allow invalid shared stylesheets when updating an app', async () => {
    const app = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const formA = createFormData({
      yaml: stripIndent(`
        name: Test App
        defaultPage: Test Page
        pages:
          - name: Test Page
            blocks:
              - type: testblock
      `),
      sharedStyle: 'this is invalid css',
    });
    authorizeStudio();
    const responseA = await request.patch(`/api/apps/${app.id}`, formA);

    const formB = createFormData({
      yaml: stripIndent(`
        name: Test App
        defaultPage: Test Page
        pages:
          - name: Test Page
            blocks:
              - type: testblock
      `),
      sharedStyle: '.foo { margin: 0 auto; }',
    });
    authorizeStudio();
    const responseB = await request.patch(`/api/apps/${app.id}`, formB);

    expect(responseA).toMatchSnapshot();
    expect(responseB).toMatchSnapshot();
  });
});

describe('setAppLock', () => {
  it('should set the locked property to true', async () => {
    authorizeStudio();
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const response = await request.post(`/api/apps/${app.id}/lock`, { locked: true });
    await app.reload();
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(app.locked).toBe(true);
  });

  it('should set the locked property to false', async () => {
    authorizeStudio();
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      locked: true,
    });

    const response = await request.post(`/api/apps/${app.id}/lock`, { locked: false });
    await app.reload();
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(app.locked).toBe(false);
  });

  it('should not be possible to set the lock status as an app editor', async () => {
    await Member.update({ role: 'AppEditor' }, { where: { UserId: user.id } });

    authorizeStudio();
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      locked: true,
    });

    const response = await request.post(`/api/apps/${app.id}/lock`, { locked: false });
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
});

describe('deleteApp', () => {
  it('should delete an app', async () => {
    authorizeStudio();
    const {
      data: { id },
    } = await request.post<AppType>(
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

    const response = await request.delete(`/api/apps/${id}`);

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should not delete non-existent apps', async () => {
    authorizeStudio();
    const response = await request.delete('/api/apps/0');

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

  it('should not delete apps from other organizations', async () => {
    const organizationB = await Organization.create({ id: 'testorganizationb' });
    const app = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organizationB.id,
    });

    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not part of this organization.",
        "statusCode": 403,
      }
    `);
  });
});

describe('getAppEmailSettings', () => {
  it('should return its default settings', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio(user);
    const response = await request.get(`/api/apps/${app.id}/email`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "emailHost": null,
        "emailName": null,
        "emailPassword": false,
        "emailPort": 587,
        "emailSecure": true,
        "emailUser": null,
      }
    `);
  });

  it('should obfuscate the email password', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      emailHost: 'smtp.gmail.com',
      emailName: 'test@example.com',
      emailUser: 'example',
      password: encrypt('password', 'key'),
    });

    authorizeStudio(user);
    const response = await request.get(`/api/apps/${app.id}/email`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "emailHost": "smtp.gmail.com",
        "emailName": "test@example.com",
        "emailPassword": false,
        "emailPort": 587,
        "emailSecure": true,
        "emailUser": "example",
      }
    `);
  });

  it('should check for the EditAppSettings permission', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      emailHost: 'smtp.gmail.com',
      emailUser: 'example',
      password: encrypt('password', 'key'),
    });

    await Member.update({ role: 'AppEditor' }, { where: { UserId: user.id } });

    authorizeStudio(user);
    const response = await request.get(`/api/apps/${app.id}/email`);

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
});

describe('getAppSnapshots', () => {
  it('should return a list of app snapshots', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    await AppSnapshot.create({
      AppId: app.id,
      UserId: user.id,
      yaml: "name: Test App\ndefaultPage: 'Test Page'",
    });
    import.meta.jest.advanceTimersByTime(60_000);
    await AppSnapshot.create({
      AppId: app.id,
      UserId: user.id,
      yaml: "name: Test App\ndefaultPage: 'Test Page'",
    });

    authorizeStudio(user);
    const response = await request.get<Snapshot[]>(`/api/apps/${app.id}/snapshots`);

    expect(response).toMatchInlineSnapshot(
      { data: [{ $author: { id: expect.any(String) } }, { $author: { id: expect.any(String) } }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$author": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$created": "1970-01-01T00:01:00.000Z",
          "id": 2,
        },
        {
          "$author": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "id": 1,
        },
      ]
    `,
    );
    expect(response.data[0].$author.id).toBe(user.id);
    expect(response.data[1].$author.id).toBe(user.id);
  });
});

describe('getAppSnapshot', () => {
  it('should return an app snapshot', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const snapshot = await AppSnapshot.create({
      AppId: app.id,
      UserId: user.id,
      yaml: "name: Test App\ndefaultPage: 'Test Page 1'",
    });
    await AppSnapshot.create({
      AppId: app.id,
      UserId: user.id,
      yaml: "name: Test App\ndefaultPage: 'Test Page 2'",
    });

    authorizeStudio(user);
    const response = await request.get(`/api/apps/${app.id}/snapshots/${snapshot.id}`);

    expect(response).toMatchInlineSnapshot(
      { data: { $author: { id: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": "Test User",
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "id": 1,
        "yaml": "name: Test App
      defaultPage: 'Test Page 1'",
      }
    `,
    );
  });

  it('should not return an snapshot for a snapshot that doesn’t exist', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    await AppSnapshot.create({
      AppId: app.id,
      UserId: user.id,
      yaml: "name: Test App\ndefaultPage: 'Test Page 1'",
    });

    authorizeStudio(user);
    const response = await request.get(`/api/apps/${app.id}/snapshots/1000`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Snapshot not found",
        "statusCode": 404,
      }
    `);
  });
});

describe('getAppIcon', () => {
  it('should serve the regular icon if requested', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/icon`, { responseType: 'arraybuffer' });
    expect(response).toMatchInlineSnapshot(
      { data: expect.any(Buffer) },
      `
      HTTP/1.1 200 OK
      Content-Type: image/png

      Any<Buffer>
    `,
    );
    expect(response.data).toMatchImageSnapshot();
  });

  it('should generate a maskable icon from a horizontal app icon', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/icon`, {
      params: { maskable: 'true' },
      responseType: 'arraybuffer',
    });
    expect(response).toMatchInlineSnapshot(
      { data: expect.any(Buffer) },
      `
      HTTP/1.1 200 OK
      Content-Type: image/png

      Any<Buffer>
    `,
    );
    expect(response.data).toMatchImageSnapshot();
  });

  it('should generate a maskable icon from a vertical app icon', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('10x50.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/icon`, {
      params: { maskable: 'true' },
      responseType: 'arraybuffer',
    });
    expect(response).toMatchInlineSnapshot(
      { data: expect.any(Buffer) },
      `
      HTTP/1.1 200 OK
      Content-Type: image/png

      Any<Buffer>
    `,
    );
    expect(response.data).toMatchImageSnapshot();
  });

  it('should use the icon background color if one is specified', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('10x50.png'),
      iconBackground: '#00ffff',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/icon`, {
      params: { maskable: 'true' },
      responseType: 'arraybuffer',
    });
    expect(response).toMatchInlineSnapshot(
      { data: expect.any(Buffer) },
      `
      HTTP/1.1 200 OK
      Content-Type: image/png

      Any<Buffer>
    `,
    );
    expect(response.data).toMatchImageSnapshot();
  });

  it('should crop and fill an maskable icon', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      maskableIcon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/icon`, {
      params: { maskable: 'true' },
      responseType: 'arraybuffer',
    });
    expect(response).toMatchInlineSnapshot(
      { data: expect.any(Buffer) },
      `
      HTTP/1.1 200 OK
      Content-Type: image/png

      Any<Buffer>
    `,
    );
    expect(response.data).toMatchImageSnapshot();
  });
});

describe('deleteAppIcon', () => {
  it('should delete existing app icons', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/icon`);
    await app.reload();
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(app.maskableIcon).toBeNull();
  });

  it('should not delete icons from non-existent apps', async () => {
    authorizeStudio();
    const response = await request.delete('/api/apps/0/icon');
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

  it('should not delete non-existent icons from apps', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/icon`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App has no icon",
        "statusCode": 404,
      }
    `);
  });
});

describe('deleteAppMaskableIcon', () => {
  it('should delete existing app maskable icons', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      maskableIcon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/maskableIcon`);
    await app.reload();
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(app.maskableIcon).toBeNull();
  });

  it('should not delete maskable icons from non-existent apps', async () => {
    authorizeStudio();
    const response = await request.delete('/api/apps/0/maskableIcon');
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

  it('should not delete non-existent maskable icons from apps', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/maskableIcon`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App has no maskable icon",
        "statusCode": 404,
      }
    `);
  });
});

describe('getAppScreenshots', () => {
  it('should throw a 404 if the app doesn’t exist', async () => {
    const response = await request.get('/api/apps/1/screenshots/1');
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

  it('should throw a 404 if the screenshot doesn’t exist', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const response = await request.get(`/api/apps/${app.id}/screenshots/1`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Screenshot not found",
        "statusCode": 404,
      }
    `);
  });

  it('should return the screenshot', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const buffer = await readFixture('standing.png');
    const screenshot = await AppScreenshot.create({
      AppId: app.id,
      screenshot: buffer,
      width: 427,
      height: 247,
      mime: 'image/png',
    });
    const response = await request.get(`/api/apps/${app.id}/screenshots/${screenshot.id}`, {
      responseType: 'arraybuffer',
    });
    expect(response).toMatchInlineSnapshot(
      { data: expect.any(Buffer) },
      `
      HTTP/1.1 200 OK
      Content-Type: image/png

      Any<Buffer>
    `,
    );
    expect(response.data).toStrictEqual(buffer);
  });
});

describe('createAppScreenshot', () => {
  it('should create one screenshot', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const form = createFormData({
      screenshots: createFixtureStream('standing.png'),
    });

    authorizeStudio();
    const createdResponse = await request.post(`/api/apps/${app.id}/screenshots`, form);

    expect(createdResponse).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      [
        1,
      ]
    `);
  });

  it('should create multiple screenshots', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const form = createFormData({
      screenshots: [createFixtureStream('standing.png'), createFixtureStream('standing.png')],
    });

    authorizeStudio();
    const createdResponse = await request.post(`/api/apps/${app.id}/screenshots`, form);

    expect(createdResponse).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      [
        1,
        2,
      ]
    `);
  });

  // XXX: Re-enable this test when updating Koas 🧀
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should not accept empty arrays of screenshots', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const form = createFormData({});

    authorizeStudio();
    const createdResponse = await request.post(`/api/apps/${app.id}/screenshots`, form);

    expect(createdResponse).toMatchInlineSnapshot();
  });

  it('should not accept files that aren’t images', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const form = createFormData({ screenshots: Buffer.from('I am not a screenshot') });

    authorizeStudio();
    const createdResponse = await request.post(`/api/apps/${app.id}/screenshots`, form);

    expect(createdResponse).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": "image/png,image/jpeg,image/tiff,image/webp",
            "instance": "I am not a screenshot",
            "message": "has an invalid content type",
            "name": "contentType",
            "path": [
              "screenshots",
              0,
            ],
            "property": "instance.screenshots[0]",
            "schema": {},
            "stack": "instance has an invalid content type",
          },
        ],
        "message": "Invalid content types found",
      }
    `);
  });
});

describe('deleteAppScreenshot', () => {
  it('should delete existing screenshots', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const buffer = await readFixture('standing.png');
    const screenshot = await AppScreenshot.create({
      AppId: app.id,
      screenshot: buffer,
      width: 427,
      height: 247,
      mime: 'image/png',
    });

    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/screenshots/${screenshot.id}`);

    const screenshots = await AppScreenshot.count();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/plain; charset=utf-8

      OK
    `);
    expect(screenshots).toBe(0);
  });

  it('should return 404 when trying to delete screenshots with IDs that don’t exist', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/screenshots/0`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Screenshot not found",
        "statusCode": 404,
      }
    `);
  });
});

describe('setAppBlockStyle', () => {
  it('should validate and update css when updating an app’s block style', async () => {
    await BlockVersion.create({
      name: 'testblock',
      OrganizationId: 'appsemble',
      description: 'This is a test block for testing purposes.',
      version: '0.0.0',
    });

    const { id } = await App.create(
      {
        path: 'bar',
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [{ name: 'Test', blocks: { type: 'testblock', version: '0.0.0' } }],
        },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    authorizeStudio();
    const response = await request.post(`/api/apps/${id}/style/block/@appsemble/testblock`, {
      style: 'body { color: yellow; }',
    });

    const style = await request.get(`/api/apps/${id}/style/block/@appsemble/testblock`);

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(style).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/css; charset=utf-8

      body { color: yellow; }
    `);
  });

  it('should delete block stylesheet when uploading empty stylesheets for an app', async () => {
    await BlockVersion.create({
      name: 'testblock',
      OrganizationId: 'appsemble',
      description: 'This is a test block for testing purposes.',
      version: '0.0.0',
    });

    const { id } = await App.create(
      {
        path: 'bar',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    authorizeStudio();
    const responseA = await request.post(`/api/apps/${id}/style/block/@appsemble/testblock`, {
      style: 'body { color: blue; }',
    });
    expect(responseA).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    authorizeStudio();
    const responseB = await request.post(`/api/apps/${id}/style/block/@appsemble/testblock`, {
      style: ' ',
    });

    expect(responseB).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const style = await AppBlockStyle.findOne({
      where: { AppId: id, block: '@appsemble/testblock' },
    });
    expect(style).toBeNull();
  });

  it('should not update an app if it is currently locked', async () => {
    await BlockVersion.create({
      name: 'testblock',
      OrganizationId: 'appsemble',
      description: 'This is a test block for testing purposes.',
      version: '0.0.0',
    });

    const { id } = await App.create(
      {
        path: 'bar',
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [{ name: 'Test', blocks: { type: 'testblock', version: '0.0.0' } }],
        },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
        locked: true,
      },
      { raw: true },
    );

    authorizeStudio();
    const response = await request.post(`/api/apps/${id}/style/block/@appsemble/testblock`, {
      style: 'body { color: yellow; }',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "App is currently locked.",
        "statusCode": 403,
      }
    `);
  });

  it('should not allow invalid stylesheets when uploading block stylesheets to an app', async () => {
    await BlockVersion.create({
      OrganizationId: 'appsemble',
      name: 'styledblock',
      description: 'This is a test block for testing purposes.',
      version: '0.0.0',
    });

    const { id } = await App.create({
      path: 'b',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      visibility: 'unlisted',
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.post(`/api/apps/${id}/style/block/@appsemble/styledblock`, {
      style: 'invalidCss',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Provided CSS was invalid.",
        "statusCode": 400,
      }
    `);
  });

  it('should not allow uploading block stylesheets to non-existent apps', async () => {
    await BlockVersion.create({
      OrganizationId: 'appsemble',
      name: 'block',
      description: 'This is a test block for testing purposes.',
      version: '0.0.0',
    });

    authorizeStudio();
    const response = await request.post('/api/apps/0/style/block/@appsemble/block', {
      style: 'body { color: red; }',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App not found.",
        "statusCode": 404,
      }
    `);
  });

  it('should not allow uploading block stylesheets for non-existent blocks', async () => {
    const { id } = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.post(`/api/apps/${id}/style/block/@appsemble/doesntexist`, {
      style: 'body { color: red; }',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Block not found.",
        "statusCode": 404,
      }
    `);
  });

  it('should return an empty response on non-existent block stylesheets', async () => {
    const { id } = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const response = await request.get(`/api/apps/${id}/style/block/@appsemble/doesntexist`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/css; charset=utf-8
    `);
  });

  it('should not allow to update an app using non-existent blocks', async () => {
    authorizeStudio();
    const { id } = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.patch(
      `/api/apps/${id}`,
      createFormData({
        'organization.id': organization.id,
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: '@non/existent'
                  version: 0.0.0'
        `),
      }),
    );

    expect(response).toMatchSnapshot();
  });

  it('should not allow to update an app using non-existent block versions', async () => {
    authorizeStudio();
    const { id } = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.patch(
      `/api/apps/${id}`,
      createFormData({
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
});

import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, AppRating, Organization, OrganizationMember, User } from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let user: User;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('queryApps', () => {
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
          "controllerCode": null,
          "controllerImplementations": null,
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
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 1,
          "locked": "unlocked",
          "path": "test-app",
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "skipGroupInvites": false,
          "template": false,
          "visibility": "public",
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "controllerCode": null,
          "controllerImplementations": null,
          "definition": {
            "defaultPage": "Another Page",
            "name": "Another App",
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
          "path": "another-app",
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "skipGroupInvites": false,
          "template": false,
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
          "controllerCode": null,
          "controllerImplementations": null,
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
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 1,
          "locked": "unlocked",
          "path": "test-app",
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "skipGroupInvites": false,
          "template": false,
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
          "controllerCode": null,
          "controllerImplementations": null,
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
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 1,
          "locked": "unlocked",
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
          "skipGroupInvites": false,
          "template": false,
          "visibility": "public",
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "controllerCode": null,
          "controllerImplementations": null,
          "definition": {
            "defaultPage": "Another Page",
            "name": "Another App",
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
          "id": 3,
          "locked": "unlocked",
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
          "skipGroupInvites": false,
          "template": false,
          "visibility": "public",
        },
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
          "path": "another-app",
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "skipGroupInvites": false,
          "template": false,
          "visibility": "public",
        },
      ]
    `);
  });
});

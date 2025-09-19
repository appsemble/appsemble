import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, Organization, OrganizationMember, type User } from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let organization: Organization;
let user: User;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('queryCurrentUserApps', () => {
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
    const responseA = await request.get('/api/users/current/apps');

    await OrganizationMember.create({
      OrganizationId: organizationB.id,
      UserId: user.id,
      role: 'Member',
    });

    const responseB = await request.get('/api/users/current/apps');

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
            "name": "Test App",
          },
          "demoMode": false,
          "displayAppMemberName": false,
          "displayInstallationPrompt": false,
          "domain": null,
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
          "path": "test-app",
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "skipGroupInvites": false,
          "supportedLanguages": null,
          "template": false,
          "version": -1,
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
            "name": "Test App",
          },
          "demoMode": false,
          "displayAppMemberName": false,
          "displayInstallationPrompt": false,
          "domain": null,
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
          "path": "test-app",
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "skipGroupInvites": false,
          "supportedLanguages": null,
          "template": false,
          "version": -1,
          "visibility": "unlisted",
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganizationb",
          "OrganizationName": "Test Organization B",
          "definition": {
            "name": "Test App B",
          },
          "demoMode": false,
          "displayAppMemberName": false,
          "displayInstallationPrompt": false,
          "domain": null,
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
          "path": "test-app-b",
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "skipGroupInvites": false,
          "supportedLanguages": null,
          "template": false,
          "version": -1,
          "visibility": "unlisted",
        },
      ]
    `);
  });
});

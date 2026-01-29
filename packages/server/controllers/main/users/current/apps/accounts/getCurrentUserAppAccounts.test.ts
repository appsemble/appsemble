import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { createServer } from '../../../../../../utils/createServer.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  App,
  Organization,
  OrganizationMember,
  type User,
  getAppDB,
} from '../../../../../../models/index.js';
import { setArgv } from '../../../../../../utils/argv.js';
import { authorizeStudio, createTestUser } from '../../../../../../utils/test/authorization.js';

let organization: Organization;
let user: User;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('getCurrentUserAppAccounts', () => {
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
      id: String(Math.floor(100_000 + Math.random() * 900_000)),
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

  it('should return an empty array if there are no connected apps', async () => {
    authorizeStudio();
    const response = await request.get('/api/users/current/apps/accounts');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      []
    `);
  });

  it('should return list of connected apps and their member accounts', async () => {
    const app = await App.create(
      {
        path: 'test-app',
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          security: {
            default: {
              role: 'Reader',
              policy: 'everyone',
            },
            roles: {
              Reader: {},
            },
          },
        },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );
    const { AppMember } = await getAppDB(app.id);
    await AppMember.create({
      email: user.primaryEmail,
      role: 'Reader',
      userId: user.id,
      name: user.name,
    });

    authorizeStudio();
    const response = await request.get('/api/users/current/apps/accounts');

    expect(response.data[0]).toMatchInlineSnapshot(
      {
        app: {
          OrganizationId: expect.any(String),
        },
        appMemberInfo: {
          sub: expect.any(String),
        },
      },
      `
      {
        "app": {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": Any<String>,
          "OrganizationName": "Test Organization",
          "controllerCode": null,
          "controllerImplementations": null,
          "definition": {
            "defaultPage": "Test Page",
            "name": "Test App",
            "security": {
              "default": {
                "policy": "everyone",
                "role": "Reader",
              },
              "roles": {
                "Reader": {},
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
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 1,
          "locked": "unlocked",
          "metaPixelID": null,
          "msClarityID": null,
          "path": "test-app",
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "skipGroupInvites": false,
          "supportedLanguages": null,
          "template": false,
          "version": -1,
          "visibility": "unlisted",
          "yaml": "name: Test App
      defaultPage: Test Page
      security:
        default:
          role: Reader
          policy: everyone
        roles:
          Reader: {}
      ",
        },
        "appMemberInfo": {
          "$ephemeral": false,
          "$seed": false,
          "demo": false,
          "email": "test@example.com",
          "email_verified": false,
          "locale": null,
          "name": "Test User",
          "phoneNumber": null,
          "picture": "https://www.gravatar.com/avatar/55502f40dc8b7c769880b10874abc9d0?s=128&d=mp",
          "properties": {},
          "role": "Reader",
          "sub": Any<String>,
          "zoneinfo": null,
        },
        "sso": [],
      }
    `,
    );
  });
});

import { createFormData } from '@appsemble/node-utils';
import { type App as AppType, PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import stripIndent from 'strip-indent';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import {
  authorizeClientCredentials,
  authorizeStudio,
  createTestUser,
} from '../../../utils/test/authorization.js';

let organization: Organization;
let user: User;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('deleteApp', () => {
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

  it('should delete an app', async () => {
    authorizeStudio();
    const response1 = await request.post<AppType>(
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
    const {
      data: { id },
    } = response1;

    expect(response1).toMatchObject({
      status: 201,
      data: {
        id,
        OrganizationId: organization.id,
        OrganizationName: organization.name,
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [
                {
                  type: 'test',
                  version: '0.0.0',
                },
              ],
            },
          ],
        },
      },
    });

    const response2 = await request.delete(`/api/apps/${id}`);

    expect(response2).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should delete an app via the CLI command.', async () => {
    await authorizeClientCredentials('apps:delete');
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      OrganizationId: organization.id,
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      showAppDefinition: false,
    });

    const { status } = await request.delete(`/api/apps/${app.id}`);
    expect(status).toBe(204);

    const response = await request.get(`/api/apps/${app.id}`);
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
        "message": "User is not a member of this organization.",
        "statusCode": 403,
      }
    `);
  });
});

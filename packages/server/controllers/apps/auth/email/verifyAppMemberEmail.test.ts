import { createFormData } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AppMember,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { createTestUser } from '../../../../utils/test/authorization.js';
import { createDefaultAppWithSecurity } from '../../../../utils/test/defaultAppSecurity.js';

let organization: Organization;
let user: User;

describe('verifyAppMemberEmail', () => {
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
      role: PredefinedOrganizationRole.Owner,
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

  it('should verify existing email addresses', async () => {
    const app = await createDefaultAppWithSecurity(organization);

    await request.post(
      `/api/apps/${app.id}/auth/email/register`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        timezone: 'Europe/Amsterdam',
      }),
    );

    const m = (await AppMember.findOne({ where: { email: 'test@example.com' } }))!;

    expect(m.emailVerified).toBe(false);
    expect(m.emailKey).not.toBeNull();

    const response = await request.post(`/api/apps/${app.id}/auth/email/verify`, {
      token: m.emailKey,
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/plain; charset=utf-8

      OK
    `);

    await m.reload();
    expect(m.emailVerified).toBe(true);
    expect(m.emailKey).toBeNull();
  });

  it('should not verify empty or invalid keys', async () => {
    const app = await createDefaultAppWithSecurity(organization);

    const responseA = await request.post(`/api/apps/${app.id}/auth/email/verify`);
    const responseB = await request.post(`/api/apps/${app.id}/auth/email/verify`, {
      token: null,
    });
    const responseC = await request.post(`/api/apps/${app.id}/auth/email/verify`, {
      token: 'invalidkey',
    });

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 415 Unsupported Media Type
      Content-Type: text/plain; charset=utf-8

      Unsupported Media Type
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": [
              "string",
            ],
            "instance": null,
            "message": "is not of a type(s) string",
            "name": "type",
            "path": [
              "token",
            ],
            "property": "instance.token",
            "schema": {
              "type": "string",
            },
            "stack": "instance.token is not of a type(s) string",
          },
        ],
        "message": "JSON schema validation failed",
      }
    `);
    expect(responseC).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Unable to verify this token.",
        "statusCode": 404,
      }
    `);
  });
});

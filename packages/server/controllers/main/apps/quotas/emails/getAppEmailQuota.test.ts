import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppEmailQuotaLog,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../../models/index.js';
import { type Argv, setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let app: App;
let user: User;
const argv: Partial<Argv> = {
  host: 'http://localhost',
  secret: 'test',
  aesSecret: 'testSecret',
  enableAppEmailQuota: true,
  dailyAppEmailQuota: 10,
};

describe('getAppEmailQuota', () => {
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
    const organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    app = await App.create({
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
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    authorizeStudio();
  });

  it('should get email quota for an app', async () => {
    await AppEmailQuotaLog.create({
      AppId: app.id,
    });
    await AppEmailQuotaLog.create({
      AppId: app.id,
    });
    await AppEmailQuotaLog.create({
      AppId: app.id,
    });

    const response = await request.get(`/api/apps/${app.id}/quotas/email`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "limit": 10,
        "reset": "1970-01-02T00:00:00.000Z",
        "used": 3,
      }
    `);
  });

  it('should reset the email quota at midnight UTC', async () => {
    await AppEmailQuotaLog.create({
      AppId: app.id,
    });
    await AppEmailQuotaLog.create({
      AppId: app.id,
    });
    await AppEmailQuotaLog.create({
      AppId: app.id,
    });

    const response1 = await request.get(`/api/apps/${app.id}/quotas/email`);

    expect(response1).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "limit": 10,
        "reset": "1970-01-02T00:00:00.000Z",
        "used": 3,
      }
    `);

    vi.useRealTimers();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    authorizeStudio(user);

    const response2 = await request.get(`/api/apps/${app.id}/quotas/email`);

    expect(response2).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "limit": 10,
        "reset": "1970-01-03T00:00:00.000Z",
        "used": 0,
      }
    `);
  });

  it('should return nothing if email quota is disabled', async () => {
    setArgv({ ...argv, enableAppEmailQuota: false });
    await AppEmailQuotaLog.create({
      AppId: app.id,
    });
    await AppEmailQuotaLog.create({
      AppId: app.id,
    });
    await AppEmailQuotaLog.create({
      AppId: app.id,
    });

    const response = await request.get(`/api/apps/${app.id}/quotas/email`);

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });
});

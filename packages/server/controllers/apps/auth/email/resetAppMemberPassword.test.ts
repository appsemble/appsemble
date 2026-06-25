import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BlockVersion,
  getAppDB,
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

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function createStoredRefreshToken(appId: number, sub: string): Promise<string> {
  const token = randomBytes(72).toString('base64url');
  const { AppMemberRefreshSession } = await getAppDB(appId);

  await AppMemberRefreshSession.create({
    aud: `app:${appId}`,
    expires: new Date('2000-02-01T00:00:00Z'),
    id: randomUUID(),
    sub,
    tokenHash: hashToken(token),
  });

  return token;
}

describe('resetAppMemberPassword', () => {
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

  it('should revoke existing refresh sessions when the password is reset', async () => {
    const app = await createDefaultAppWithSecurity(organization);
    const { AppMember, AppMemberRefreshSession } = await getAppDB(app.id);
    const appMember = await AppMember.create({
      email: 'test@example.com',
      primaryEmail: 'test@example.com',
      name: 'Test App Member',
      password: await hash('testpassword', 10),
      role: 'Reader',
      resetKey: 'reset-token',
      locale: 'en',
      timezone: 'Europe/Amsterdam',
    });
    const token = await createStoredRefreshToken(app.id, appMember.id);

    const response = await request.post(`/api/apps/${app.id}/auth/email/reset-password`, {
      token: 'reset-token',
      password: 'newpassword1',
    });

    expect(response.status).toBe(204);
    expect(
      await AppMemberRefreshSession.findOne({ where: { tokenHash: hashToken(token) } }),
    ).toBeNull();
  });

  it('should return not found when resetting using a non-existent token', async () => {
    const app = await createDefaultAppWithSecurity(organization);

    const response = await request.post(`/api/apps/${app.id}/auth/email/reset-password`, {
      token: 'idontexist',
      password: 'whatever',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Unknown password reset token: idontexist",
        "statusCode": 404,
      }
    `);
  });
});

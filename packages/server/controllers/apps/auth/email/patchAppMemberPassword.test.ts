import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { App, type AppMember, getAppDB, Organization } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeAppMember, createTestAppMember } from '../../../../utils/test/authorization.js';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function createStoredRefreshToken(appId: number, sub: string): Promise<string> {
  const token = randomBytes(72).toString('base64url');
  const { AppMemberRefreshSession } = await getAppDB(appId);

  await AppMemberRefreshSession.create({
    aud: `app:${appId}`,
    expires: new Date(Date.now() + 60_000),
    id: randomUUID(),
    sub,
    tokenHash: hashToken(token),
  });

  return token;
}

let server: Koa;
let app: App;
let member: AppMember;

describe('patchAppMemberPassword', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    const organization = await Organization.create({ id: 'appsemble' });
    app = await App.create({
      definition: {
        name: 'Test App',
        description: 'Test App',
      },
      OrganizationId: organization.id,
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });
    member = await createTestAppMember(app.id);
  });

  it('should change the password of the user', async () => {
    authorizeAppMember(app, member);

    const response = await request.patch(`/api/apps/${app.id}/auth/email/password`, {
      newPassword: 'newpassword1',
      currentPassword: 'testpassword',
    });

    expect(response.status).toBe(200);
    expect(response.data).toBe('OK');

    const headers = response.headers as Record<string, string[] | undefined>;
    const setCookie = headers['set-cookie'] ?? headers['Set-Cookie'];

    expect(setCookie).toStrictEqual(
      expect.arrayContaining([
        expect.stringMatching(
          new RegExp(
            `^app_refresh_token=; path=/apps/${app.id}/auth/oauth2/token; expires=Thu, 01 Jan 1970 00:00:00 GMT;.*$`,
            'i',
          ),
        ),
        expect.stringMatching(
          new RegExp(
            `^app_refresh_token\\.sig=[^;]+; path=/apps/${app.id}/auth/oauth2/token; expires=Thu, 01 Jan 1970 00:00:00 GMT;.*$`,
            'i',
          ),
        ),
      ]),
    );
  });

  it('should revoke existing refresh sessions when the password is changed', async () => {
    authorizeAppMember(app, member);
    const token = await createStoredRefreshToken(app.id, member.id);
    const { AppMemberRefreshSession } = await getAppDB(app.id);

    const response = await request.patch(`/api/apps/${app.id}/auth/email/password`, {
      newPassword: 'newpassword1',
      currentPassword: 'testpassword',
    });

    expect(response.status).toBe(200);
    expect(
      await AppMemberRefreshSession.findOne({ where: { tokenHash: hashToken(token) } }),
    ).toBeNull();
  });

  it('should return a 401 Unauthorized if logged in but current password input is wrong', async () => {
    authorizeAppMember(app, member);
    const response = await request.patch(`/api/apps/${app.id}/auth/email/password`, {
      newPassword: 'whatever',
      currentPassword: `wrong ${member.password}`,
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "Old password is incorrect.",
        "statusCode": 401,
      }
    `);
  });
});

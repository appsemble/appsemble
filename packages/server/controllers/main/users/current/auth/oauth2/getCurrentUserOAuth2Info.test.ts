import { type UserInfo } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, AppMember, Organization, User } from '../../../../../../models/index.js';
import { setArgv } from '../../../../../../utils/argv.js';
import { createServer } from '../../../../../../utils/createServer.js';
import {
  authorizeApp,
  authorizeStudio,
  createTestUser,
} from '../../../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../../../utils/test/testSchema.js';

let user: User;

useTestDatabase(import.meta);

beforeAll(async () => {
  vi.useFakeTimers();
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
  vi.clearAllTimers();
  vi.setSystemTime(new Date('2000-01-01T00:00:00Z'));
  user = await createTestUser();
});

afterAll(() => {
  vi.useRealTimers();
});

describe('getCurrentUserOAuth2Info', () => {
  it('should return userinfo formatted as defined by OpenID', async () => {
    authorizeStudio();
    const response = await request.get('/api/users/current/auth/oauth2');
    expect(response).toMatchObject({
      status: 200,
      data: {
        email: 'test@example.com',
        email_verified: true,
        name: 'Test User',
        picture: 'https://www.gravatar.com/avatar/55502f40dc8b7c769880b10874abc9d0?s=128&d=mp',
        sub: user.id,
      },
    });
  });

  it('should work if the user has no primary email address', async () => {
    await user.update({ primaryEmail: null });
    authorizeStudio();
    const response = await request.get('/api/users/current/auth/oauth2');
    expect(response).toMatchObject({
      status: 200,
      data: {
        email: null,
        email_verified: false,
        name: 'Test User',
        sub: user.id,
      },
    });
  });

  it('should return 403 forbidden if the user isn’t an app member', async () => {
    await Organization.create({ id: 'test-organization' });
    const app = await App.create({
      definition: {},
      OrganizationId: 'test-organization',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    authorizeApp(app);
    const response = await request.get<UserInfo>('/api/users/current/auth/oauth2');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "Forbidden",
        "statusCode": 403,
      }
    `);
  });

  it('should use app member information when an app requests the info', async () => {
    await Organization.create({ id: 'test-organization' });
    const app = await App.create({
      definition: {},
      OrganizationId: 'test-organization',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    await AppMember.create({
      AppId: app.id,
      UserId: user.id,
      role: 'test',
      email: 'test@example.com',
      emailVerified: true,
      name: 'Test User',
      picture: Buffer.from('PNG'),
    });
    authorizeApp(app);
    const response = await request.get<UserInfo>('/api/users/current/auth/oauth2');
    expect(response).toMatchInlineSnapshot(
      { data: { sub: expect.stringMatching(uuid4Pattern), picture: expect.any(String) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "email": "test@example.com",
        "email_verified": true,
        "locale": null,
        "name": "Test User",
        "picture": Any<String>,
        "properties": {},
        "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "zoneinfo": "Europe/Amsterdam",
      }
    `,
    );
    expect(response.data.sub).toBe(user.id);
    expect(response.data.picture).toBe(
      `http://localhost/api/apps/1/members/${user.id}/picture?updated=946684800000`,
    );
  });

  it('should return 403 forbidden if the user is deleted', async () => {
    authorizeStudio(user);
    await user.destroy();
    expect(await User.findAll()).toHaveLength(0);

    const response = await request.get<UserInfo>('/api/users/current/auth/oauth2');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "Forbidden",
        "statusCode": 403,
      }
    `);
  });

  it('should fall back to gravatar for the profile picture', async () => {
    await Organization.create({ id: 'test-organization' });
    const app = await App.create({
      definition: {},
      OrganizationId: 'test-organization',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    await AppMember.create({
      AppId: app.id,
      UserId: user.id,
      role: 'test',
      email: 'test@example.com',
      emailVerified: true,
      name: 'Test User',
    });
    authorizeApp(app);
    const response = await request.get<UserInfo>('/api/users/current/auth/oauth2');
    expect(response).toMatchInlineSnapshot(
      { data: { sub: expect.stringMatching(uuid4Pattern) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "email": "test@example.com",
        "email_verified": true,
        "locale": null,
        "name": "Test User",
        "picture": "https://www.gravatar.com/avatar/55502f40dc8b7c769880b10874abc9d0?s=128&d=mp",
        "properties": {},
        "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "zoneinfo": "Europe/Amsterdam",
      }
    `,
    );
    expect(response.data.sub).toBe(user.id);
  });
});

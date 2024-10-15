import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { OAuth2ClientCredentials, User } from '../../../../../../../models/index.js';
import { setArgv } from '../../../../../../../utils/argv.js';
import { createServer } from '../../../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../../../utils/test/authorization.js';

let user: User;

describe('listOAuth2ClientCredentials', () => {
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

  it('should list register OAuth2 client credentials for the authenticated user', async () => {
    const otherUser = await User.create({ timezone: 'Europe/Amsterdam' });
    await OAuth2ClientCredentials.create({
      description: 'Test client',
      expires: new Date('2000-02-02T00:00:00Z'),
      id: 'fooId',
      scopes: 'blocks:write',
      secret: 'fooSecret',
      UserId: user.id,
    });
    await OAuth2ClientCredentials.create({
      description: 'Other user’s test client',
      expires: new Date('2000-02-02T00:00:00Z'),
      id: 'barId',
      scopes: 'organizations:write',
      secret: 'barSecret',
      UserId: otherUser.id,
    });

    authorizeStudio();
    const response = await request.get('/api/users/current/auth/oauth2/client-credentials');
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          created: '2000-01-01T00:00:00.000Z',
          description: 'Test client',
          expires: '2000-02-02T00:00:00.000Z',
          id: 'fooId',
          scopes: ['blocks:write'],
        },
      ],
    });
  });

  it('should omit expired credentials', async () => {
    await OAuth2ClientCredentials.create({
      description: 'Test client',
      expires: new Date('2000-02-02T00:00:00Z'),
      id: 'validId',
      scopes: 'blocks:write',
      secret: 'validSecret',
      UserId: user.id,
    });
    await OAuth2ClientCredentials.create({
      description: 'Test client',
      expires: new Date('1999-01-01T00:00:00Z'),
      id: 'expiredId',
      scopes: 'organizations:write',
      secret: 'expiredSecret',
      UserId: user.id,
    });

    authorizeStudio();
    const response = await request.get('/api/users/current/auth/oauth2/client-credentials');
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          created: '2000-01-01T00:00:00.000Z',
          description: 'Test client',
          expires: '2000-02-02T00:00:00.000Z',
          id: 'validId',
          scopes: ['blocks:write'],
        },
      ],
    });
  });
});

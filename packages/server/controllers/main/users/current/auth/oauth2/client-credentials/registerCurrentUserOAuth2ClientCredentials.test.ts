import { type OAuth2ClientCredentials as OAuth2ClientCredentialsType } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { compare } from 'bcrypt';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { OAuth2ClientCredentials } from '../../../../../../../models/index.js';
import { setArgv } from '../../../../../../../utils/argv.js';
import { createServer } from '../../../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../../../utils/test/authorization.js';

describe('registerCurrentUserOAuth2ClientCredentials', () => {
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
    await createTestUser();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should register OAuth2 client credentials', async () => {
    authorizeStudio();
    const response = await request.post<OAuth2ClientCredentialsType>(
      '/api/users/current/auth/oauth2/client-credentials',
      {
        description: 'Test client',
        expires: '2345-01-02T03:04:05Z',
        scopes: ['organizations:write', 'blocks:write'],
      },
    );
    expect(response).toMatchObject({
      status: 201,
      data: {
        created: '2000-01-01T00:00:00.000Z',
        description: 'Test client',
        expires: '2345-01-02T03:04:05.000Z',
        id: expect.stringMatching(/^[\da-z]{32}$/),
        scopes: ['blocks:write', 'organizations:write'],
        secret: expect.stringMatching(/^[\da-z]{64}$/),
      },
    });
    const credentials = (await OAuth2ClientCredentials.findOne())!;
    expect(await compare(response.data.secret!, credentials.secret)).toBe(true);
  });

  it('should not allow to create already expired client credentials', async () => {
    authorizeStudio();
    const response = await request.post('/api/users/current/auth/oauth2/client-credentials', {
      description: 'Test client',
      expires: '1999-01-02T03:04:05Z',
      scopes: ['organizations:write', 'blocks:write'],
    });
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'Bad Request',
        message: 'These credentials have already expired',
        statusCode: 400,
      },
    });
  });
});

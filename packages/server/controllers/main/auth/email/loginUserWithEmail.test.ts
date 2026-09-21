import { basicAuth } from '@appsemble/node-utils';
import { jwtPattern } from '@appsemble/utils';
import { type AxiosResponse } from 'axios';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { EmailAuthorization, type User } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { createTestUser } from '../../../../utils/test/authorization.js';

let user: User;

function login(email: string): Promise<AxiosResponse> {
  return request.post('/api/auth/email/login', undefined, {
    headers: { authorization: basicAuth(email, 'testpassword') },
  });
}

describe('loginUserWithEmail', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    user = await createTestUser();
  });

  it('should log in with a verified email', async () => {
    const response = await login('test@example.com');

    expect(response).toMatchObject({
      status: 200,
      data: { access_token: expect.stringMatching(jwtPattern) },
    });
  });

  it('should refuse an unverified email', async () => {
    await EmailAuthorization.create({ UserId: user.id, email: 'unverified@example.com' });

    const response = await login('unverified@example.com');

    expect(response.status).toBe(401);
  });

  it('should refuse an unknown email', async () => {
    const response = await login('unknown@example.com');

    expect(response.status).toBe(401);
  });
});

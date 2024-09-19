import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { OAuthAuthorization, User } from '../../../../../../../models/index.js';
import { setArgv } from '../../../../../../../utils/argv.js';
import { createServer } from '../../../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../../../../utils/test/testSchema.js';

const mock = new MockAdapter(axios);
let user: User;

useTestDatabase(import.meta);

beforeEach(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
  user = await createTestUser();
});

afterEach(() => {
  mock.reset();
});

describe('getCurrentUserOAuth2Authorizations', () => {
  it('should return the linked accounts of the logged in user', async () => {
    await OAuthAuthorization.create({
      email: '',
      UserId: user.id,
      accessToken: '',
      authorizationUrl: 'https://a.example',
      sub: 'aubA',
    });

    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    await OAuthAuthorization.create({
      email: '',
      UserId: userB.id,
      accessToken: '',
      authorizationUrl: 'https://b.example',
      sub: 'aubB',
    });

    authorizeStudio();
    const response = await request.get('/api/users/current/auth/oauth2/authorizations');
    expect(response).toMatchObject({
      status: 200,
      data: [{ authorizationUrl: 'https://a.example' }],
    });
  });
});

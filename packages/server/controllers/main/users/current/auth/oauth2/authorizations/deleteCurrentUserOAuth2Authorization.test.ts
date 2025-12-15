import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { OAuthAuthorization, User } from '../../../../../../../models/index.js';
import { setArgv } from '../../../../../../../utils/argv.js';
import { createServer } from '../../../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../../../utils/test/authorization.js';

const mock = new MockAdapter(axios);
let user: User;

describe('deleteCurrentUserOAuth2Authorization', () => {
  beforeEach(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
    user = await createTestUser();
  });

  afterEach(() => {
    mock.reset();
  });

  it('should delete a linked account', async () => {
    const oauthAuthorization = await OAuthAuthorization.create({
      UserId: user.id,
      email: '',
      accessToken: '',
      authorizationUrl: 'https://a.example',
      sub: 'aubA',
    });
    authorizeStudio();
    const response = await request.delete('/api/users/current/auth/oauth2/authorizations', {
      params: { authorizationUrl: 'https://a.example' },
    });
    expect(response).toMatchObject({
      status: 204,
      data: '',
    });

    await expect(oauthAuthorization.reload()).rejects.toThrowError(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
  });

  it('should not delete a linked account for another user', async () => {
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    await OAuthAuthorization.create({
      UserId: userB.id,
      email: '',
      accessToken: '',
      authorizationUrl: 'https://b.example',
      sub: 'aubB',
    });

    authorizeStudio();
    const response = await request.delete('/api/users/current/auth/oauth2/authorizations', {
      params: { authorizationUrl: 'https://b.example' },
    });
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'OAuth2 account to unlink not found',
        statusCode: 404,
      },
    });
  });
});

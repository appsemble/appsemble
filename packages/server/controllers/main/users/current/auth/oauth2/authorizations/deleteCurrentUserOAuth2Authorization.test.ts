import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  OAuthAuthorization,
  Organization,
  OrganizationSso,
  OrganizationSsoIdentity,
  User,
} from '../../../../../../../models/index.js';
import { setArgv } from '../../../../../../../utils/argv.js';
import { createServer } from '../../../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../../../utils/test/authorization.js';

const mock = new MockAdapter(axios as ConstructorParameters<typeof MockAdapter>[0]);
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

    await expect(oauthAuthorization.reload()).rejects.toThrow(
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

  it('should keep personal access when another social login remains registered', async () => {
    await user.update({ password: null });
    await OAuthAuthorization.bulkCreate(
      ['https://a.example', 'https://accounts.google.com/o/oauth2/auth'].map(
        (authorizationUrl) => ({
          UserId: user.id,
          email: '',
          accessToken: '',
          authorizationUrl,
          sub: 'staff',
        }),
      ),
    );
    authorizeStudio();

    const response = await request.delete('/api/users/current/auth/oauth2/authorizations', {
      params: { authorizationUrl: 'https://a.example' },
    });

    expect({ status: response.status, data: response.data }).toStrictEqual({
      status: 204,
      data: '',
    });
  });

  it.each(['configured', 'removed'])(
    'should request personal recovery after unlinking the last social login with organization SSO %s',
    async (provider) => {
      await user.update({ password: null });
      await OAuthAuthorization.create({
        UserId: user.id,
        email: '',
        accessToken: '',
        authorizationUrl: 'https://a.example',
        sub: 'legacy-staff',
      });
      await Organization.create({ id: 'staff', name: 'Staff' });
      const sso = await OrganizationSso.create({
        OrganizationId: 'staff',
        issuer: 'https://sso.example/realms/staff',
        clientId: 'studio',
        clientSecret: Buffer.from('secret'),
        name: 'Staff',
        scope: 'openid',
        groupClaim: 'groups',
        policy: 'optional',
        managedBy: 'deployment',
        allowedLoginMethods: ['password'],
        configurationUpdated: new Date(),
      });
      await OrganizationSsoIdentity.create({
        UserId: user.id,
        issuer: sso.issuer,
        subject: 'staff',
      });
      if (provider === 'removed') {
        await sso.destroy();
      }
      authorizeStudio();

      const response = await request.delete('/api/users/current/auth/oauth2/authorizations', {
        params: { authorizationUrl: 'https://a.example' },
      });

      expect({ status: response.status, data: response.data }).toStrictEqual({
        status: 201,
        data: true,
      });
    },
  );
});

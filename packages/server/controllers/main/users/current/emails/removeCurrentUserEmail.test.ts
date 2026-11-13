import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EmailAuthorization,
  OAuthAuthorization,
  Organization,
  OrganizationMember,
  OrganizationSsoIdentity,
  User,
} from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let user: User;

describe('removeCurrentUserEmail', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    vi.useFakeTimers();
    user = await createTestUser();
    const organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  it('should delete emails', async () => {
    await EmailAuthorization.create({
      email: 'test2@example.com',
      verified: true,
      UserId: user.id,
    });

    authorizeStudio();
    const response = await request.delete('/api/users/current/emails', {
      data: { email: 'test2@example.com' },
    });

    expect(response).toMatchObject({ status: 204 });

    const { data } = await request.get('/api/users/current');

    expect(data).not.toContainEqual({
      email: 'test2@example.com',
      email_verified: true,
    });
  });

  it('should not delete non-associated emails', async () => {
    authorizeStudio();
    const response = await request.delete('/api/users/current/emails', {
      data: { email: 'test2@example.com' },
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'This email address is not associated with your account.',
      },
    });
  });

  it('should not delete the last login method', async () => {
    authorizeStudio();
    const response = await request.delete('/api/users/current/emails', {
      data: { email: 'test@example.com' },
    });

    expect(response).toMatchObject({
      status: 406,
      data: {
        statusCode: 406,
        error: 'Not Acceptable',
        message: 'Deleting this email results in the inability to access this account.',
      },
    });
  });

  it.each(['social login', 'organization SSO'])(
    'should allow removal of the last email when %s remains registered',
    async (method) => {
      await user.update({ password: null });
      await (method === 'social login'
        ? OAuthAuthorization.create({
            UserId: user.id,
            email: '',
            accessToken: '',
            authorizationUrl: 'https://a.example',
            sub: 'legacy-staff',
          })
        : OrganizationSsoIdentity.create({
            UserId: user.id,
            issuer: 'https://sso.example/realms/staff',
            subject: 'staff',
          }));
      authorizeStudio();

      const response = await request.delete('/api/users/current/emails', {
        data: { email: 'test@example.com' },
      });
      const { data: emails } = await request.get('/api/users/current/emails');

      expect({ status: response.status, emails }).toStrictEqual({ status: 204, emails: [] });
    },
  );

  it('should keep the last email when only another user has organization SSO', async () => {
    const otherUser = await User.create({ timezone: 'Europe/Amsterdam' });
    await OrganizationSsoIdentity.create({
      UserId: otherUser.id,
      issuer: 'https://sso.example/realms/staff',
      subject: 'other-staff',
    });
    authorizeStudio();

    const response = await request.delete('/api/users/current/emails', {
      data: { email: 'test@example.com' },
    });

    expect(response.status).toBe(406);
  });
});

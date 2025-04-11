import { type LoginCodeResponse, PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppMember,
  OAuth2AuthorizationCode,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../../../../models/index.js';
import { setArgv } from '../../../../../../../utils/argv.js';
import { createServer } from '../../../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../../../utils/test/authorization.js';

let user: User;

describe('verifyCurrentUserOAuth2AppConsent', () => {
  let organization: Organization;

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

    organization = await Organization.create({
      id: 'org',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should create an authorization code for the user and app on a default domain if the user has previously agreed', async () => {
    const app = await App.create({
      OrganizationId: organization.id,
      path: 'app',
      definition: {
        security: {
          default: {
            role: 'User',
            policy: 'everyone',
          },
          roles: { User: {} },
        },
      },
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });
    const member = await AppMember.create({
      AppId: app.id,
      UserId: user.id,
      email: user.primaryEmail,
      consent: new Date(),
      role: 'User',
    });
    authorizeStudio();
    const response = await request.post<LoginCodeResponse>(
      `/api/users/current/auth/oauth2/apps/${app.id}/consent/verify`,
      {
        redirectUri: 'http://app.org.localhost:9999',
        scope: 'openid',
      },
    );
    expect(response).toMatchObject({
      status: 200,
      data: {
        code: expect.stringMatching(/^[0-f]{24}$/),
      },
    });

    const { code } = response.data;
    const authCode = await OAuth2AuthorizationCode.findOne({ raw: true, where: { code } });
    expect(authCode).toStrictEqual({
      AppId: app.id,
      code,
      expires: new Date('2000-01-01T00:10:00.000Z'),
      redirectUri: 'http://app.org.localhost:9999',
      scope: 'openid',
      AppMemberId: member.id,
    });
  });

  it('should verify consent only for the current app', async () => {
    const app = await App.create({
      OrganizationId: organization.id,
      path: 'app',
      definition: {
        security: {
          default: {
            role: 'User',
            policy: 'everyone',
          },
          roles: { User: {} },
        },
      },
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });
    const app2 = await App.create({
      OrganizationId: organization.id,
      path: 'test-app',
      definition: {
        security: {
          default: {
            role: 'User',
            policy: 'everyone',
          },
          roles: { User: {} },
        },
      },
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });

    await AppMember.create({
      AppId: app2.id,
      UserId: user.id,
      email: user.primaryEmail,
      consent: new Date(),
      role: 'User',
    });
    authorizeStudio();
    const response = await request.post(
      `/api/users/current/auth/oauth2/apps/${app.id}/consent/verify`,
      {
        redirectUri: 'http://app.org.localhost:9999',
        scope: 'openid',
      },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'Bad Request',
        statusCode: 400,
        message: 'User has not agreed to the requested scopes',
      },
    });
  });

  it('should create an authorization code for the user and app on a custom domain if the user has previously agreed', async () => {
    const app = await App.create({
      OrganizationId: organization.id,
      path: 'app',
      domain: 'app.example',
      definition: {
        security: {
          default: {
            role: 'User',
            policy: 'everyone',
          },
          roles: { User: {} },
        },
      },
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });
    const member = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      consent: new Date(),
      role: 'User',
    });
    authorizeStudio();
    const response = await request.post<LoginCodeResponse>(
      `/api/users/current/auth/oauth2/apps/${app.id}/consent/verify`,
      {
        redirectUri: 'http://app.example:9999',
        scope: 'email',
      },
    );
    expect(response).toMatchObject({
      status: 200,
      data: {
        code: expect.stringMatching(/^[0-f]{24}$/),
      },
    });

    const { code } = response.data;
    const authCode = await OAuth2AuthorizationCode.findOne({ raw: true, where: { code } });
    expect(authCode).toStrictEqual({
      AppId: app.id,
      code,
      expires: new Date('2000-01-01T00:10:00.000Z'),
      redirectUri: 'http://app.example:9999',
      scope: 'email',
      AppMemberId: member.id,
    });
  });

  it('should block if a user hasn’t agreed before', async () => {
    const app = await App.create({
      OrganizationId: organization.id,
      path: 'app',
      domain: 'app.example',
      definition: { name: 'app' },
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });
    authorizeStudio();
    const response = await request.post(
      `/api/users/current/auth/oauth2/apps/${app.id}/consent/verify`,
      {
        redirectUri: 'http://invalid.example:9999',
        scope: 'email openid',
      },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'Bad Request',
        message: 'User has not agreed to the requested scopes',
        statusCode: 400,
        data: {
          isAllowed: true,
          appName: 'app',
        },
      },
    });
  });

  it('should block if user has agreed before but isn’t allowed anymore due to the policy', async () => {
    const app = await App.create({
      OrganizationId: organization.id,
      path: 'app',
      domain: 'app.example',
      definition: { security: { default: { policy: 'invite' } } },
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });

    authorizeStudio();
    const response = await request.post(
      `/api/users/current/auth/oauth2/apps/${app.id}/consent/verify`,
      {
        redirectUri: 'http://app.example:9999',
        scope: 'openid',
      },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'Bad Request',
        data: { isAllowed: false },
        message: 'User is not allowed to login due to the app’s security policy',
        statusCode: 400,
      },
    });
  });

  it('should block if user isn’t allowed due to the policy', async () => {
    const app = await App.create({
      OrganizationId: organization.id,
      path: 'app',
      domain: 'app.example',
      definition: { security: { default: { policy: 'invite' } } },
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });
    authorizeStudio();
    const response = await request.post(
      `/api/users/current/auth/oauth2/apps/${app.id}/consent/verify`,
      {
        redirectUri: 'http://app.example:9999',
        scope: 'openid',
      },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'Bad Request',
        data: { isAllowed: false },
        message: 'User is not allowed to login due to the app’s security policy',
        statusCode: 400,
      },
    });
  });

  it('should return 404 for non-existent apps', async () => {
    authorizeStudio();
    const response = await request.post('/api/users/current/auth/oauth2/apps/346/consent/verify', {
      redirectUri: 'http://any.example:9999',
      scope: 'openid',
    });
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'App not found',
        statusCode: 404,
      },
    });
  });
});

import { type LoginCodeResponse, PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../../../../models/index.js';
import { setArgv } from '../../../../../../../utils/argv.js';
import { createServer } from '../../../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../../../utils/test/authorization.js';

let user: User;

describe('agreeCurrentUserOAuth2AppConsent', () => {
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

  it('should create an authorization code linked to the user and app on a default domain', async () => {
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
    authorizeStudio();
    const response = await request.post<LoginCodeResponse>(
      `/api/users/current/auth/oauth2/apps/${app.id}/consent/agree`,
      {
        redirectUri: 'http://app.org.localhost:9999',
        scope: 'openid',
      },
    );
    expect(response).toMatchObject({
      status: 201,
      data: {
        code: expect.stringMatching(/^[0-f]{24}$/),
      },
    });

    const { code } = response.data;
    const { OAuth2AuthorizationCode } = await getAppDB(app.id);
    const authCode = await OAuth2AuthorizationCode.findOne({ raw: true, where: { code } });
    expect(authCode).toStrictEqual({
      code,
      expires: new Date('2000-01-01T00:10:00.000Z'),
      redirectUri: 'http://app.org.localhost:9999',
      scope: 'openid',
      AppMemberId: expect.any(String),
    });
  });

  it('should create an authorization code linked to the user and app on a custom domain', async () => {
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
    authorizeStudio();
    const response = await request.post<LoginCodeResponse>(
      `/api/users/current/auth/oauth2/apps/${app.id}/consent/agree`,
      {
        redirectUri: 'http://app.example:9999',
        scope: 'email',
      },
    );
    expect(response).toMatchObject({
      status: 201,
      data: {
        code: expect.stringMatching(/^[0-f]{24}$/),
      },
    });

    const { code } = response.data;
    const { OAuth2AuthorizationCode } = await getAppDB(app.id);
    const authCode = await OAuth2AuthorizationCode.findOne({ raw: true, where: { code } });
    expect(authCode).toStrictEqual({
      code,
      expires: new Date('2000-01-01T00:10:00.000Z'),
      redirectUri: 'http://app.example:9999',
      scope: 'email',
      AppMemberId: expect.any(String),
    });
  });

  it('should block invalid login attempts', async () => {
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
    authorizeStudio();
    const response = await request.post(
      `/api/users/current/auth/oauth2/apps/${app.id}/consent/agree`,
      {
        redirectUri: 'http://invalid.example:9999',
        scope: 'openid',
      },
    );
    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'Invalid redirectUri',
        statusCode: 403,
      },
    });
  });

  it('should block if user is not allowed to login due to the app’s security policy', async () => {
    const app = await App.create({
      OrganizationId: organization.id,
      path: 'app',
      domain: 'app.example',
      definition: {
        security: {
          default: {
            role: 'User',
            policy: 'invite',
          },
          roles: { User: {} },
        },
      },
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });

    authorizeStudio();
    const response = await request.post(
      `/api/users/current/auth/oauth2/apps/${app.id}/consent/agree`,
      {
        redirectUri: 'http://app.org.localhost:9999',
        scope: 'openid',
      },
    );
    expect(response).toMatchObject({
      status: 401,
      data: {
        data: { isAllowed: false },
        message: 'User is not allowed to login due to the app’s security policy',
        statusCode: 401,
      },
    });
  });

  it('should return 404 for non-existent apps', async () => {
    authorizeStudio();
    const response = await request.post('/api/users/current/auth/oauth2/apps/346/consent/agree', {
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

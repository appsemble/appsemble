import FakeTimers from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';

import { App, Member, OAuth2AuthorizationCode, OAuth2Consent, Organization, User } from '../models';
import { createServer } from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import { testToken } from '../utils/test/testToken';

let authorization: string;
let clock: FakeTimers.InstalledClock;

let user: User;

beforeAll(createTestSchema('oauth2provider'));

beforeAll(async () => {
  const server = await createServer({ argv: { host: 'http://localhost', secret: 'test' } });
  await setTestApp(server);
});

beforeEach(async () => {
  await truncate();
  clock = FakeTimers.install();
  clock.setSystemTime(new Date('2000-01-01T00:00:00Z'));
  ({ authorization, user } = await testToken());
});

afterEach(truncate);

afterEach(() => {
  clock.uninstall();
});

afterAll(closeTestSchema);

describe('getUserInfo', () => {
  it('should return userinfo formatted as defined by OpenID', async () => {
    const response = await request.get('/api/connect/userinfo', { headers: { authorization } });
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
    const response = await request.get('/api/connect/userinfo', { headers: { authorization } });
    expect(response).toMatchObject({
      status: 200,
      data: {
        email: null,
        email_verified: false,
        name: 'Test User',
        picture: null,
        sub: user.id,
      },
    });
  });
});

describe('verifyOAuth2Consent', () => {
  let organization: Organization;

  beforeEach(async () => {
    organization = await Organization.create({
      id: 'org',
      name: 'Test Organization',
    });
    await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
  });

  it('should create an authorization code for the user and app on a default domain if the user has previously agreed', async () => {
    const app = await App.create({
      OrganizationId: organization.id,
      path: 'app',
      definition: {},
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });
    await OAuth2Consent.create({ scope: 'openid', AppId: app.id, UserId: user.id });
    const response = await request.post(
      '/api/oauth2/consent/verify',
      { appId: app.id, redirectUri: 'http://app.org.localhost:9999', scope: 'openid' },
      { headers: { authorization } },
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
      UserId: user.id,
    });
  });

  it('should create an authorization code for the user and app on a custom domain if the user has previously agreed', async () => {
    const app = await App.create({
      OrganizationId: organization.id,
      path: 'app',
      domain: 'app.example',
      definition: {},
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });
    await OAuth2Consent.create({ scope: 'email', AppId: app.id, UserId: user.id });
    const response = await request.post(
      '/api/oauth2/consent/verify',
      { appId: app.id, redirectUri: 'http://app.example:9999', scope: 'email' },
      { headers: { authorization } },
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
      UserId: user.id,
    });
  });

  it('should block if a user hasn’t agreed before', async () => {
    const app = await App.create({
      OrganizationId: organization.id,
      path: 'app',
      domain: 'app.example',
      definition: {},
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });
    await OAuth2Consent.create({ scope: 'openid', AppId: app.id, UserId: user.id });
    const response = await request.post(
      '/api/oauth2/consent/verify',
      { appId: app.id, redirectUri: 'http://invalid.example:9999', scope: 'email openid' },
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'Bad Request',
        message: 'User has not agreed to the requested scopes',
        statusCode: 400,
      },
    });
  });

  it('should block if the previously agreed scope doesn’t match the current scope', async () => {
    const app = await App.create({
      OrganizationId: organization.id,
      path: 'app',
      domain: 'app.example',
      definition: {},
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });
    const response = await request.post(
      '/api/oauth2/consent/verify',
      { appId: app.id, redirectUri: 'http://invalid.example:9999', scope: 'openid' },
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'Bad Request',
        message: 'User has not agreed to the requested scopes',
        statusCode: 400,
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
    await OAuth2Consent.create({ scope: 'openid', AppId: app.id, UserId: user.id });

    const response = await request.post(
      '/api/oauth2/consent/verify',
      { appId: app.id, redirectUri: 'http://app.example:9999', scope: 'openid' },
      { headers: { authorization } },
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
    const response = await request.post(
      '/api/oauth2/consent/verify',
      { appId: app.id, redirectUri: 'http://app.example:9999', scope: 'openid' },
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'Bad Request',
        data: { isAllowed: false },
        message: 'User has not agreed to the requested scopes',
        statusCode: 400,
      },
    });
  });

  it('should return 404 for non-existent apps', async () => {
    const response = await request.post(
      '/api/oauth2/consent/verify',
      { appId: 346, redirectUri: 'http://any.example:9999', scope: 'openid' },
      { headers: { authorization } },
    );
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

describe('agreeOAuth2Consent', () => {
  let organization: Organization;

  beforeEach(async () => {
    organization = await Organization.create({
      id: 'org',
      name: 'Test Organization',
    });
    await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
  });

  it('should create an authorization code linked to the user and app on a default domain', async () => {
    const app = await App.create({
      OrganizationId: organization.id,
      path: 'app',
      definition: {},
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });
    const response = await request.post(
      '/api/oauth2/consent/agree',
      { appId: app.id, redirectUri: 'http://app.org.localhost:9999', scope: 'openid' },
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 201,
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
      UserId: user.id,
    });
  });

  it('should create an authorization code linked to the user and app on a custom domain', async () => {
    const app = await App.create({
      OrganizationId: organization.id,
      path: 'app',
      domain: 'app.example',
      definition: {},
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });
    const response = await request.post(
      '/api/oauth2/consent/agree',
      { appId: app.id, redirectUri: 'http://app.example:9999', scope: 'email' },
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 201,
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
      UserId: user.id,
    });
  });

  it('should block invalid login attempts', async () => {
    const app = await App.create({
      OrganizationId: organization.id,
      path: 'app',
      domain: 'app.example',
      definition: {},
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });
    const response = await request.post(
      '/api/oauth2/consent/agree',
      { appId: app.id, redirectUri: 'http://invalid.example:9999', scope: 'openid' },
      { headers: { authorization } },
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

  it('should return 404 for non-existent apps', async () => {
    const response = await request.post(
      '/api/oauth2/consent/agree',
      { appId: 346, redirectUri: 'http://any.example:9999', scope: 'openid' },
      { headers: { authorization } },
    );
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

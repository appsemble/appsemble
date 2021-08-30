import { Clock, install } from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';

import { App, AppMember, Member, OAuth2AuthorizationCode, Organization, User } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeStudio, createTestUser } from '../utils/test/authorization';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

let clock: Clock;
let user: User;

beforeAll(createTestSchema('oauth2provider'));

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  await truncate();
  clock = install();
  clock.setSystemTime(new Date('2000-01-01T00:00:00Z'));
  user = await createTestUser();
});

afterEach(truncate);

afterEach(() => {
  clock.uninstall();
});

afterAll(closeTestSchema);

describe('getUserInfo', () => {
  it('should return userinfo formatted as defined by OpenID', async () => {
    authorizeStudio();
    const response = await request.get('/api/connect/userinfo');
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
    authorizeStudio();
    const response = await request.get('/api/connect/userinfo');
    expect(response).toMatchObject({
      status: 200,
      data: {
        email: null,
        email_verified: false,
        name: 'Test User',
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
      AppId: app.id,
      UserId: user.id,
      consent: new Date(),
      role: 'User',
    });
    authorizeStudio();
    const response = await request.post('/api/oauth2/consent/verify', {
      appId: app.id,
      redirectUri: 'http://app.org.localhost:9999',
      scope: 'openid',
    });
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
      AppId: app.id,
      UserId: user.id,
      consent: new Date(),
      role: 'User',
    });
    authorizeStudio();
    const response = await request.post('/api/oauth2/consent/verify', {
      appId: app.id,
      redirectUri: 'http://app.example:9999',
      scope: 'email',
    });
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
    authorizeStudio();
    const response = await request.post('/api/oauth2/consent/verify', {
      appId: app.id,
      redirectUri: 'http://invalid.example:9999',
      scope: 'email openid',
    });
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

    authorizeStudio();
    const response = await request.post('/api/oauth2/consent/verify', {
      appId: app.id,
      redirectUri: 'http://app.example:9999',
      scope: 'openid',
    });
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
    const response = await request.post('/api/oauth2/consent/verify', {
      appId: app.id,
      redirectUri: 'http://app.example:9999',
      scope: 'openid',
    });
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
    const response = await request.post('/api/oauth2/consent/verify', {
      appId: 346,
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
    const response = await request.post('/api/oauth2/consent/agree', {
      appId: app.id,
      redirectUri: 'http://app.org.localhost:9999',
      scope: 'openid',
    });
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
    const response = await request.post('/api/oauth2/consent/agree', {
      appId: app.id,
      redirectUri: 'http://app.example:9999',
      scope: 'email',
    });
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
    const response = await request.post('/api/oauth2/consent/agree', {
      appId: app.id,
      redirectUri: 'http://invalid.example:9999',
      scope: 'openid',
    });
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
    const response = await request.post('/api/oauth2/consent/agree', {
      appId: app.id,
      redirectUri: 'http://app.org.localhost:9999',
      scope: 'openid',
    });
    expect(response).toMatchObject({
      status: 400,
      data: {
        data: { isAllowed: false },
        message: 'User is not allowed to login due to the app’s security policy',
        statusCode: 400,
      },
    });
  });

  it('should return 404 for non-existent apps', async () => {
    authorizeStudio();
    const response = await request.post('/api/oauth2/consent/agree', {
      appId: 346,
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

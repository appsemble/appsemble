import { Clock, install } from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';

import { App, AppMember, EmailAuthorization, Member, Organization, User } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeStudio, createTestUser } from '../utils/test/authorization';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

let clock: Clock;
let user: User;

beforeAll(createTestSchema('user'));

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  clock = install();
  user = await createTestUser();
  const organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
});

afterEach(truncate);

afterEach(() => {
  clock.uninstall();
});

afterAll(closeTestSchema);

describe('getUser', () => {
  it('should return a user profile', async () => {
    authorizeStudio();
    const response = await request.get('/api/user');

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: expect.any(String),
        name: 'Test User',
        primaryEmail: 'test@example.com',
        emails: [{ email: 'test@example.com', primary: true, verified: true }],
        organizations: [{ id: 'testorganization', name: 'Test Organization' }],
      },
    });
  });

  it('should not return a user profile if not logged in', async () => {
    const response = await request.get('/api/user');
    expect(response).toMatchObject({ status: 401 });
  });
});

describe('getUserOrganizations', () => {
  it('should fetch all user organizations', async () => {
    const organizationB = await Organization.create({ id: 'testorganizationb' });
    await Member.create({ OrganizationId: organizationB.id, UserId: user.id });

    authorizeStudio();
    const response = await request.get('/api/user/organizations');
    expect(response).toMatchObject({
      status: 200,
      data: [
        { id: 'testorganization', name: 'Test Organization', role: 'Owner' },
        { id: 'testorganizationb', name: null, role: 'Member' },
      ],
    });
  });
});

describe('updateUser', () => {
  it('should update the user display name', async () => {
    authorizeStudio();
    const response = await request.put('/api/user', { name: 'John' });

    expect(response).toMatchObject({
      status: 200,
      data: { name: 'John' },
    });
  });

  it('should set a verified email as primary email', async () => {
    await EmailAuthorization.create({
      email: 'test2@example.com',
      verified: true,
      UserId: user.id,
    });

    authorizeStudio();
    const response = await request.put('/api/user', {
      name: 'Test User',
      email: 'test2@example.com',
    });
    expect(response).toMatchObject({
      status: 200,
      data: {
        email: 'test2@example.com',
      },
    });
  });

  it('should not set a non-existent email as primary email', async () => {
    authorizeStudio();
    const response = await request.put('/api/user', {
      name: 'Test User',
      email: 'test2@example.com',
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'No matching email could be found.',
      },
    });
  });

  it('should not set an unverified email as primary email', async () => {
    authorizeStudio();
    await request.post('/api/user/email', { email: 'test2@example.com' });

    const response = await request.put('/api/user', {
      name: 'Test User',
      email: 'test2@example.com',
    });

    expect(response).toMatchObject({
      status: 406,
      data: {
        statusCode: 406,
        error: 'Not Acceptable',
        message: 'This email address has not been verified.',
      },
    });
  });
});

describe('addEmail', () => {
  it('should be possible to add new email addresses', async () => {
    authorizeStudio();
    const response = await request.post('/api/user/email', { email: 'test2@example.com' });

    expect(response).toMatchObject({ status: 201 });

    const responseB = await request.get('/api/user/email');
    expect(responseB).toMatchObject({
      status: 200,
      data: [
        {
          email: 'test2@example.com',
          verified: false,
        },
        {
          email: 'test@example.com',
          verified: true,
        },
      ],
    });
  });

  it('should not be possible to register the same email twice', async () => {
    authorizeStudio();
    const response = await request.post('/api/user/email', { email: 'test@example.com' });

    expect(response).toMatchObject({ status: 409 });
  });
});

describe('removeEmail', () => {
  it('should delete emails', async () => {
    await EmailAuthorization.create({
      email: 'test2@example.com',
      verified: true,
      UserId: user.id,
    });

    authorizeStudio();
    const response = await request.delete('/api/user/email', {
      data: { email: 'test2@example.com' },
    });

    expect(response).toMatchObject({ status: 204 });

    const { data } = await request.get('/api/user');

    expect(data.emails).not.toContainEqual({
      email: 'test2@example.com',
      verified: true,
      primary: false,
    });
  });

  it('should not delete non-associated emails', async () => {
    authorizeStudio();
    const response = await request.delete('/api/user/email', {
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
    const response = await request.delete('/api/user/email', {
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
});

describe('refreshToken', () => {
  it('should generate a new access token', async () => {
    const tokens = authorizeStudio();
    const response = await request.post('/api/refresh', { refresh_token: tokens.refresh_token });
    expect(response).toMatchObject({
      status: 200,
      data: {
        access_token: expect.any(String),
        expires_in: 3600,
        refresh_token: expect.any(String),
        token_type: 'bearer',
      },
    });
  });

  it('should return unauthorized if the refresh token can’t be verified', async () => {
    const response = await request.post('/api/refresh', { refresh_token: 'invalid' });
    expect(response).toMatchObject({
      status: 401,
      data: {
        error: 'Unauthorized',
        message: 'Invalid refresh token',
        statusCode: 401,
      },
    });
  });
});

describe('getAppAccounts', () => {
  it('should return all of the user’s app accounts', async () => {
    authorizeStudio();

    const appA = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    const appB = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    await AppMember.create({ AppId: appA.id, UserId: user.id, role: 'Admin' });
    await AppMember.create({ AppId: appB.id, UserId: user.id, role: 'Member' });

    const response = await request.get('/api/user/apps/accounts');

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          app: {
            $created: '1970-01-01T00:00:00.000Z',
            $updated: '1970-01-01T00:00:00.000Z',
            OrganizationId: 'testorganization',
            OrganizationName: 'Test Organization',
            definition: {},
            domain: null,
            hasIcon: false,
            hasMaskableIcon: false,
            iconBackground: '#ffffff',
            iconUrl: null,
            id: 1,
            locked: false,
            longDescription: null,
            path: null,
            private: false,
            showAppsembleLogin: false,
            showAppsembleOAuth2Login: true,
            yaml: '{}\n',
          },
          role: 'Admin',
        },
        {
          app: {
            $created: '1970-01-01T00:00:00.000Z',
            $updated: '1970-01-01T00:00:00.000Z',
            OrganizationId: 'testorganization',
            OrganizationName: 'Test Organization',
            definition: {},
            domain: null,
            hasIcon: false,
            hasMaskableIcon: false,
            iconBackground: '#ffffff',
            iconUrl: null,
            id: 2,
            locked: false,
            longDescription: null,
            path: null,
            private: false,
            showAppsembleLogin: false,
            showAppsembleOAuth2Login: true,
            yaml: '{}\n',
          },
          role: 'Member',
        },
      ],
    });
  });
});

describe('getAppAccount', () => {
  it('should return the user’s app account', async () => {
    authorizeStudio();

    const app = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    const response = await request.get(`/api/user/apps/${app.id}/account`);

    expect(response).toMatchObject({
      status: 200,
      data: {
        app: {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          OrganizationId: 'testorganization',
          OrganizationName: 'Test Organization',
          definition: {},
          domain: null,
          hasIcon: false,
          hasMaskableIcon: false,
          iconBackground: '#ffffff',
          iconUrl: null,
          id: 1,
          locked: false,
          longDescription: null,
          path: null,
          private: false,
          showAppsembleLogin: false,
          showAppsembleOAuth2Login: true,
          yaml: '{}\n',
        },
        role: 'Member',
      },
    });
  });

  it('should throw 404 if the app account doesn’t exist', async () => {
    authorizeStudio();

    const app = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });

    const response = await request.get(`/api/user/apps/${app.id}/account`);

    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'App account not found',
        statusCode: 404,
      },
    });
  });

  it('should throw 404 if the app doesn’t exist', async () => {
    authorizeStudio();

    const response = await request.get('/api/user/apps/404/account');

    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'App account not found',
        statusCode: 404,
      },
    });
  });
});

describe('updateAppAccount', () => {
  it('should return the user’s app account', async () => {
    authorizeStudio();

    const app = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    const appMember = await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    const response = await request.put(`/api/user/apps/${app.id}/account`, {
      name: 'Me',
      email: 'user@example.com',
    });

    expect(response).toMatchObject({
      status: 200,
      data: {
        app: {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          OrganizationId: 'testorganization',
          OrganizationName: 'Test Organization',
          definition: {},
          domain: null,
          hasIcon: false,
          hasMaskableIcon: false,
          iconBackground: '#ffffff',
          iconUrl: null,
          id: 1,
          locked: false,
          longDescription: null,
          path: null,
          private: false,
          showAppsembleLogin: false,
          showAppsembleOAuth2Login: true,
          yaml: '{}\n',
        },
        name: 'Me',
        email: 'user@example.com',
        role: 'Member',
      },
    });
    await appMember.reload();
    expect(appMember.name).toBe('Me');
    expect(appMember.email).toBe('user@example.com');
  });

  it('should throw 404 if the app account doesn’t exist', async () => {
    authorizeStudio();

    const app = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });

    const response = await request.put(`/api/user/apps/${app.id}/account`, {
      name: '',
      email: 'user@example.com',
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'App account not found',
        statusCode: 404,
      },
    });
  });

  it('should throw 404 if the app doesn’t exist', async () => {
    authorizeStudio();

    const response = await request.put('/api/user/apps/404/account', {
      name: '',
      email: 'user@example.com',
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'App account not found',
        statusCode: 404,
      },
    });
  });
});

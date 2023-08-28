import { type User as APIUser } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';

import { EmailAuthorization, Member, Organization, User } from '../models/index.js';
import { argv, setArgv, updateArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let user: User;

useTestDatabase(import.meta);

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
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
});

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

    const { data } = await request.get<APIUser>('/api/user');

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

describe('getSubscribedUsers', () => {
  beforeEach(() => {
    updateArgv({ adminApiSecret: 'testAdminAPIsecret' });
  });

  it('should return a list of subscribed users', async () => {
    const user2 = await createTestUser('user2@example.com');

    const response = await request.get('/api/subscribed', {
      headers: { authorization: `Bearer ${argv.adminApiSecret}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(2);
    expect(response.data).toStrictEqual([
      {
        email: user.primaryEmail,
        name: user.name,
        locale: user.locale,
      },
      {
        email: user2.primaryEmail,
        name: user2.name,
        locale: user2.locale,
      },
    ]);
  });

  it('should not subscribe deleted users', async () => {
    const deletedUser = await User.create({
      deleted: new Date(),
      password: null,
      name: 'Test User',
      primaryEmail: 'deleted@example.com',
      timezone: 'Europe/Amsterdam',
    });
    deletedUser.EmailAuthorizations = [
      await EmailAuthorization.create({
        UserId: deletedUser.id,
        email: 'deleted@example.com',
        verified: true,
      }),
    ];
    deletedUser.save();

    user.subscribed = true;
    user.save();

    const response = await request.get('/api/subscribed', {
      headers: { authorization: `Bearer ${argv.adminApiSecret}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(1);
    expect(response.data).toStrictEqual([
      {
        email: user.primaryEmail,
        name: user.name,
        locale: user.locale,
      },
    ]);
  });

  it('should return a 401 if admin API secret is not passed', async () => {
    updateArgv({ adminApiSecret: '' });

    const response = await request.get('/api/subscribed');
    expect(response.status).toBe(401);
  });

  it('should return 401 if the provided admin api secret is wrong', async () => {
    const wrongSecret = `${argv.adminApiSecret} + wrong secret`;

    const response = await request.get('/api/subscribed', {
      headers: { authorization: `Bearer ${wrongSecret}` },
    });

    expect(response.status).toBe(401);
  });
});

describe('unsubscribe', () => {
  beforeEach(() => {
    updateArgv({ adminApiSecret: 'testAdminAPIsecret' });
  });

  it('should unsubscribe a user already subscribed to the newsletter', async () => {
    const response = await request.post(
      '/api/unsubscribe',
      { email: user.primaryEmail },
      {
        headers: { authorization: `Bearer ${argv.adminApiSecret}` },
      },
    );

    expect(response.status).toBe(201);
    expect(response.data).toContain(user.primaryEmail);
  });

  it('should return 401 if the admin api secret is missing', async () => {
    // Unsetting the secret should result in 401 regardless of whether the correct secret is passed
    const secret = argv.adminApiSecret;
    updateArgv({ adminApiSecret: '' });

    const response = await request.post(
      '/api/unsubscribe',
      { email: user.primaryEmail },
      {
        headers: { authorization: `Bearer ${secret}` },
      },
    );

    expect(response.status).toBe(401);
  });

  it('should return 401 if the provided admin api secret is wrong', async () => {
    const wrongSecret = `${argv.adminApiSecret} + wrong secret`;

    const response = await request.post(
      '/api/unsubscribe',
      { email: user.primaryEmail },
      {
        headers: { authorization: `Bearer ${wrongSecret}` },
      },
    );

    expect(response.status).toBe(401);
  });

  it('should return 400 if the provided email does not match an existing user', async () => {
    const wrongEmail = 'wrongTestEmail';
    const response = await request.post(
      '/api/unsubscribe',
      { email: wrongEmail },
      {
        headers: { authorization: `Bearer ${argv.adminApiSecret}` },
      },
    );

    expect(response.status).toBe(400);
  });
});

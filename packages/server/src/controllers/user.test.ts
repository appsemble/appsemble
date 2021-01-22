import { request, setTestApp } from 'axios-test-instance';

import { EmailAuthorization, Member, Organization, User } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import { testToken } from '../utils/test/testToken';

let user: User;
let authorization: string;

beforeAll(createTestSchema('user'));

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  ({ authorization, user } = await testToken());
  const organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
});

afterEach(truncate);

afterAll(closeTestSchema);

describe('getUser', () => {
  it('should return a user profile', async () => {
    const response = await request.get('/api/user', { headers: { authorization } });

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

    const response = await request.get('/api/user/organizations', {
      headers: { authorization },
    });
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
    const response = await request.put(
      '/api/user',
      { name: 'John' },
      { headers: { authorization } },
    );

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

    const response = await request.put(
      '/api/user',
      { name: 'Test User', email: 'test2@example.com' },
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 200,
      data: {
        email: 'test2@example.com',
      },
    });
  });

  it('should not set a non-existent email as primary email', async () => {
    const response = await request.put(
      '/api/user',
      { name: 'Test User', email: 'test2@example.com' },
      { headers: { authorization } },
    );

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
    await request.post(
      '/api/user/email',
      { email: 'test2@example.com' },
      { headers: { authorization } },
    );

    const response = await request.put(
      '/api/user',
      { name: 'Test User', email: 'test2@example.com' },
      { headers: { authorization } },
    );

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
    const response = await request.post(
      '/api/user/email',
      { email: 'test2@example.com' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({ status: 201 });

    const responseB = await request.get('/api/user/email', {
      headers: { authorization },
    });
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
    const response = await request.post(
      '/api/user/email',
      { email: 'test@example.com' },
      { headers: { authorization } },
    );

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

    const response = await request.delete('/api/user/email', {
      headers: { authorization },
      data: { email: 'test2@example.com' },
    });

    expect(response).toMatchObject({ status: 204 });

    const { data } = await request.get('/api/user', { headers: { authorization } });

    expect(data.emails).not.toContainEqual({
      email: 'test2@example.com',
      verified: true,
      primary: false,
    });
  });

  it('should not delete non-associated emails', async () => {
    const response = await request.delete('/api/user/email', {
      headers: { authorization },
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
    const response = await request.delete('/api/user/email', {
      headers: { authorization },
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

import { randomBytes } from 'crypto';
import { createReadStream, promises as fs } from 'fs';
import { join } from 'path';

import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';
import type * as Koa from 'koa';

import { EmailAuthorization, Member, Organization, OrganizationInvite, User } from '../models';
import { createServer } from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import { testToken } from '../utils/test/testToken';

let authorization: string;
let organization: Organization;
let server: Koa;
let user: User;

beforeAll(createTestSchema('organizations'));

beforeAll(async () => {
  server = await createServer({ argv: { host: 'http://localhost', secret: 'test' } });
  await setTestApp(server);
});

beforeEach(async () => {
  ({ authorization, user } = await testToken());
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
  await Organization.create({ id: 'appsemble', name: 'Appsemble' });
  jest.spyOn(server.context.mailer, 'sendTemplateEmail');
});

afterEach(truncate);

afterAll(closeTestSchema);

describe('getOrganization', () => {
  it('should fetch an organization', async () => {
    const response = await request.get('/api/organizations/testorganization', {
      headers: { authorization },
    });

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: 'testorganization',
        name: 'Test Organization',
      },
    });
  });

  it('should not fetch a non-existent organization', async () => {
    const response = await request.get('/api/organizations/foo', { headers: { authorization } });

    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', statusCode: 404, message: 'Organization not found.' },
    });
  });
});

describe('patchOrganization', () => {
  it('should update the name of the organization', async () => {
    const formData = new FormData();
    formData.append('name', 'Test');

    const response = await request.patch(`/api/organizations/${organization.id}`, formData, {
      headers: { authorization, ...formData.getHeaders() },
    });
    expect(response).toMatchObject({ data: { id: organization.id, name: 'Test' } });
  });

  it('should update the logo of the organization', async () => {
    const formData = new FormData();
    formData.append('icon', createReadStream(join(__dirname, '__fixtures__', 'testpattern.png')));

    const response = await request.patch(`/api/organizations/${organization.id}`, formData, {
      headers: { authorization, ...formData.getHeaders() },
    });

    await organization.reload();

    const buffer = await fs.readFile(join(__dirname, '__fixtures__', 'testpattern.png'));

    expect(response).toMatchObject({ data: { id: organization.id, name: 'Test Organization' } });
    expect(organization.icon).toStrictEqual(buffer);
  });

  it('should not allow anything if the user is not an owner', async () => {
    await Member.update(
      { role: 'Member' },
      { where: { OrganizationId: organization.id, UserId: user.id } },
    );
    const formData = new FormData();
    formData.append('name', 'Test');

    const response = await request.patch(`/api/organizations/${organization.id}`, formData, {
      headers: { authorization, ...formData.getHeaders() },
    });
    expect(response).toMatchObject({
      data: { message: 'User does not have sufficient permissions.' },
      status: 403,
    });
  });
});

describe('createOrganization', () => {
  it('should create a new organization', async () => {
    const response = await request.post(
      '/api/organizations',
      { id: 'foo', name: 'Foooo' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 201,
      data: {
        id: 'foo',
        name: 'Foooo',
        members: [
          {
            id: expect.any(String),
            name: 'Test User',
            primaryEmail: 'test@example.com',
            role: 'Owner',
          },
        ],
        invites: [],
      },
    });
  });

  it('should not create a new organization if user is unverified', async () => {
    await EmailAuthorization.update({ verified: false }, { where: { UserId: user.id } });

    const response = await request.post(
      '/api/organizations',
      { id: 'foo', name: 'Foooo' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'Email not verified.',
        statusCode: 403,
      },
    });
  });

  it('should not create an organization with the same identifier', async () => {
    await request.post(
      '/api/organizations',
      { id: 'foo', name: 'Foooo' },
      { headers: { authorization } },
    );

    const response = await request.post(
      '/api/organizations',
      { id: 'foo', name: 'Foooo' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 409,
      data: { message: 'Another organization with the name “Foooo” already exists' },
    });
  });
});

describe('getMembers', () => {
  it('should fetch organization members', async () => {
    const response = await request.get('/api/organizations/testorganization/members', {
      headers: { authorization },
    });

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: expect.any(String),
          name: 'Test User',
          primaryEmail: 'test@example.com',
          role: 'Owner',
        },
      ],
    });
  });
});

describe('getInvites', () => {
  it('should fetch organization invites', async () => {
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    await userB.$create('User', { primaryEmail: 'test2@example.com', name: 'John' });
    await OrganizationInvite.create({
      email: 'test2@example.com',
      key: 'abcde',
      OrganizationId: 'testorganization',
    });

    const response = await request.get('/api/organizations/testorganization/invites', {
      headers: { authorization },
    });

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          email: 'test2@example.com',
        },
      ],
    });
  });
});

describe('inviteMembers', () => {
  it('should require the InviteMember permission', async () => {
    await Member.update({ role: 'Member' }, { where: { UserId: user.id } });

    const response = await request.post(
      '/api/organizations/testorganization/invites',
      [{ email: 'a@example.com' }],
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User does not have sufficient permissions.',
        statusCode: 403,
      },
    });
    expect(server.context.mailer.sendTemplateEmail).not.toHaveBeenCalled();
  });

  it('should throw a bad request of all invitees are already in the organization', async () => {
    const userA = await User.create({ primaryEmail: 'a@example.com' });
    await EmailAuthorization.create({ UserId: userA.id, email: 'a@example.com' });
    await Member.create({ OrganizationId: organization.id, UserId: userA.id });

    const userB = await User.create({ primaryEmail: 'b@example.com' });
    await EmailAuthorization.create({ UserId: userB.id, email: 'b@example.com' });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id });

    const response = await request.post(
      '/api/organizations/testorganization/invites',
      [{ email: 'a@example.com' }, { email: 'b@example.com' }],
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'Bad Request',
        message: 'All invited users are already part of this organization',
        statusCode: 400,
      },
    });
    expect(server.context.mailer.sendTemplateEmail).not.toHaveBeenCalled();
  });

  it('should throw a bad request of all new invitees are have already been invited', async () => {
    const userA = await User.create({ primaryEmail: 'a@example.com' });
    await EmailAuthorization.create({ UserId: userA.id, email: 'a@example.com' });
    await Member.create({ OrganizationId: organization.id, UserId: userA.id });

    await OrganizationInvite.create({
      OrganizationId: organization.id,
      email: 'b@example.com',
      key: randomBytes(20).toString('hex'),
    });

    const response = await request.post(
      '/api/organizations/testorganization/invites',
      [{ email: 'a@example.com' }, { email: 'b@example.com' }],
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'Bad Request',
        message: 'All email addresses are already invited to this organization',
        statusCode: 400,
      },
    });
    expect(server.context.mailer.sendTemplateEmail).not.toHaveBeenCalled();
  });

  it('should invite users by their primary email', async () => {
    const userA = await User.create({ primaryEmail: 'a@example.com' });
    await EmailAuthorization.create({ UserId: userA.id, email: 'a@example.com' });
    await EmailAuthorization.create({ UserId: userA.id, email: 'aa@example.com' });

    const response = await request.post(
      '/api/organizations/testorganization/invites',
      [{ email: 'aa@example.com' }],
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 201,
      data: [{ email: 'a@example.com' }],
    });

    const invite = await OrganizationInvite.findOne();
    expect(invite).toMatchObject({
      email: 'a@example.com',
      key: expect.stringMatching(/^\w{40}$/),
      OrganizationId: 'testorganization',
      UserId: userA.id,
    });
    expect(server.context.mailer.sendTemplateEmail).toHaveBeenCalledWith(
      { email: 'a@example.com' },
      'organizationInvite',
      {
        organization: 'testorganization',
        url: `http://localhost/organization-invite?token=${invite.key}`,
      },
    );
  });

  it('should invite unknown email addresses', async () => {
    const response = await request.post(
      '/api/organizations/testorganization/invites',
      [{ email: 'a@example.com' }],
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 201,
      data: [{ email: 'a@example.com' }],
    });

    const invite = await OrganizationInvite.findOne();
    expect(invite).toMatchObject({
      email: 'a@example.com',
      key: expect.stringMatching(/^\w{40}$/),
      OrganizationId: 'testorganization',
      UserId: null,
    });
    expect(server.context.mailer.sendTemplateEmail).toHaveBeenCalledWith(
      { email: 'a@example.com' },
      'organizationInvite',
      {
        organization: 'testorganization',
        url: `http://localhost/organization-invite?token=${invite.key}`,
      },
    );
  });
});

describe('resendInvitation', () => {
  it('should resend an invitation', async () => {
    await OrganizationInvite.create({
      email: 'test2@example.com',
      key: 'invitekey',
      OrganizationId: 'testorganization',
    });

    const response = await request.post(
      '/api/organizations/testorganization/invites/resend',
      { email: 'test2@example.com' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({ status: 204 });
    expect(server.context.mailer.sendTemplateEmail).toHaveBeenCalledWith(
      { email: 'test2@example.com' },
      'organizationInvite',
      {
        organization: 'testorganization',
        url: 'http://localhost/organization-invite?token=invitekey',
      },
    );
  });

  it('should not resend an invitation if the user does not have the right permissions', async () => {
    await Member.update({ role: 'AppEditor' }, { where: { UserId: user.id } });
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    await userB.$create('User', { primaryEmail: 'test2@example.com', name: 'John' });

    await request.post(
      '/api/organizations/testorganization/invites',
      { email: 'test2@example.com' },
      { headers: { authorization } },
    );

    const response = await request.post(
      '/api/organizations/testorganization/invites/resend',
      { email: 'test2@example.com' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User does not have sufficient permissions.',
        statusCode: 403,
      },
    });
    expect(server.context.mailer.sendTemplateEmail).not.toHaveBeenCalled();
  });

  it('should not resend an invitation to a member who has not been invited', async () => {
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    await userB.$create('User', { primaryEmail: 'test2@example.com', name: 'John' });

    const response = await request.post(
      '/api/organizations/testorganization/invites/resend',
      { email: 'test2@example.com' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'This person was not invited previously.',
        statusCode: 404,
      },
    });
    expect(server.context.mailer.sendTemplateEmail).not.toHaveBeenCalled();
  });

  it('should not resend an invitation for a non-existent organization', async () => {
    const response = await request.post(
      '/api/organizations/foo/invites/resend',
      { email: 'test2@example.com' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Organization not found.',
        statusCode: 404,
      },
    });
    expect(server.context.mailer.sendTemplateEmail).not.toHaveBeenCalled();
  });
});

describe('removeInvite', () => {
  it('should revoke an invite', async () => {
    await OrganizationInvite.create({
      email: 'test2@example.com',
      key: 'invitekey',
      OrganizationId: 'testorganization',
    });

    const response = await request.delete('/api/organizations/testorganization/invites', {
      headers: { authorization },
      data: { email: 'test2@example.com' },
    });

    expect(response).toMatchObject({ status: 204 });
  });

  it('should not revoke an invite if the user does not have the right permissions', async () => {
    await OrganizationInvite.create({
      email: 'test2@example.com',
      key: 'invitekey',
      OrganizationId: 'testorganization',
    });

    await Member.update({ role: 'AppEditor' }, { where: { UserId: user.id } });

    const response = await request.delete('/api/organizations/testorganization/invites', {
      headers: { authorization },
      data: { email: 'test2@example.com' },
    });

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User does not have sufficient permissions.',
        statusCode: 403,
      },
    });
  });

  it('should not revoke a non-existent invite', async () => {
    const response = await request.delete('/api/organizations/testorganization/invites', {
      headers: { authorization },
      data: { email: 'test2@example.com' },
    });

    expect(response).toMatchObject({ status: 404 });
  });

  it('should not revoke an invite for an organization you are not a member of', async () => {
    await Organization.create({ id: 'org' });
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    await userB.$create('User', { primaryEmail: 'test2@example.com', name: 'John' });
    await OrganizationInvite.create({
      email: 'test2@example.com',
      key: 'abcde',
      OrganizationId: 'org',
    });
    const response = await request.delete('/api/organizations/org/invites', {
      headers: { authorization },
      data: { email: 'test2@example.com' },
    });

    expect(response).toMatchObject({
      status: 403,
      data: {
        message: 'User is not part of this organization.',
      },
    });
  });
});

describe('removeMember', () => {
  it('should leave the organization if there are other members', async () => {
    // Set member role to the lowest available role, since this should not require any permissions
    await Member.update({ role: 'Member' }, { where: { UserId: user.id } });

    const userB = await User.create();
    await Member.create({ UserId: userB.id, OrganizationId: organization.id, role: 'Member' });

    const result = await request.delete(`/api/organizations/testorganization/members/${user.id}`, {
      headers: { authorization },
    });

    expect(result.status).toBe(204);
  });

  it('should remove other members from an organization', async () => {
    const userB = await User.create();
    await Member.create({ UserId: userB.id, OrganizationId: organization.id, role: 'Member' });

    const { status } = await request.delete(
      `/api/organizations/testorganization/members/${userB.id}`,
      {
        headers: { authorization },
      },
    );

    expect(status).toBe(204);
  });

  it('should not remove the only remaining member in an organization', async () => {
    const response = await request.delete(
      `/api/organizations/testorganization/members/${user.id}`,
      {
        headers: { authorization },
      },
    );

    expect(response).toMatchObject({
      status: 406,
      data: {
        message:
          'Not allowed to remove yourself from an organization if you’re the only member left.',
      },
    });
  });

  it('should not remove non-members or non-existing users from an organization', async () => {
    const userB = await User.create();
    const responseA = await request.delete(
      `/api/organizations/testorganization/members/${userB.id}`,
      { headers: { authorization } },
    );
    const responseB = await request.delete('/api/organizations/testorganization/members/0', {
      headers: { authorization },
    });

    expect(responseA).toMatchObject({
      status: 404,
      data: { message: 'This member is not part of this organization.' },
    });

    expect(responseB).toMatchObject({
      status: 404,
      data: { message: 'This member is not part of this organization.' },
    });
  });
});

describe('setRole', () => {
  it('should change the role of other members', async () => {
    const userB = await User.create({ name: 'Foo', primaryEmail: 'test2@example.com' });
    await Member.create({ UserId: userB.id, OrganizationId: organization.id, role: 'Member' });

    const response = await request.put(
      `/api/organizations/testorganization/members/${userB.id}/role`,
      { role: 'AppEditor' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: 'Foo',
        primaryEmail: 'test2@example.com',
        role: 'AppEditor',
      },
    });
  });
});

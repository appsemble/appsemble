import { randomBytes } from 'crypto';

import { createFormData, readFixture } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';
import * as Koa from 'koa';

import { EmailAuthorization, Member, Organization, OrganizationInvite, User } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeStudio, createTestUser } from '../utils/test/authorization';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

let organization: Organization;
let server: Koa;
let user: User;

beforeAll(createTestSchema('organizations'));

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  user = await createTestUser();
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
    authorizeStudio();
    const response = await request.get('/api/organizations/testorganization');

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: 'testorganization',
        name: 'Test Organization',
      },
    });
  });

  it('should not fetch a non-existent organization', async () => {
    authorizeStudio();
    const response = await request.get('/api/organizations/foo');

    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', statusCode: 404, message: 'Organization not found.' },
    });
  });
});

describe('getOrganizationIcon', () => {
  it('should return the organization logo', async () => {
    const buffer = await readFixture('testpattern.png');
    await organization.update({ icon: buffer });
    const response = await request.get(`/api/organizations/${organization.id}/icon`, {
      responseType: 'arraybuffer',
    });

    expect(response.data).toMatchImageSnapshot();
  });
});

describe('patchOrganization', () => {
  it('should update the name of the organization', async () => {
    authorizeStudio();
    const response = await request.patch(
      `/api/organizations/${organization.id}`,
      createFormData({ name: 'Test' }),
    );
    expect(response).toMatchObject({ data: { id: organization.id, name: 'Test' } });
  });

  it('should update the logo of the organization', async () => {
    const formData = new FormData();
    const buffer = await readFixture('testpattern.png');

    formData.append('icon', buffer, { filename: 'icon.png' });

    authorizeStudio();
    const response = await request.patch(`/api/organizations/${organization.id}`, formData);

    await organization.reload();

    expect(response).toMatchObject({ data: { id: organization.id, name: 'Test Organization' } });
    expect(organization.icon).toStrictEqual(buffer);
  });

  it('should not allow anything if the user is not an owner', async () => {
    await Member.update(
      { role: 'Member' },
      { where: { OrganizationId: organization.id, UserId: user.id } },
    );

    authorizeStudio();
    const response = await request.patch(
      `/api/organizations/${organization.id}`,
      createFormData({ name: 'Test' }),
    );
    expect(response).toMatchObject({
      data: { message: 'User does not have sufficient permissions.' },
      status: 403,
    });
  });
});

describe('createOrganization', () => {
  it('should create a new organization', async () => {
    authorizeStudio();
    const response = await request.post('/api/organizations', { id: 'foo', name: 'Foooo' });

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

    authorizeStudio();
    const response = await request.post('/api/organizations', { id: 'foo', name: 'Foooo' });

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
    authorizeStudio();
    await request.post('/api/organizations', { id: 'foo', name: 'Foooo' });

    const response = await request.post('/api/organizations', { id: 'foo', name: 'Foooo' });

    expect(response).toMatchObject({
      status: 409,
      data: { message: 'Another organization with the name “Foooo” already exists' },
    });
  });
});

describe('getMembers', () => {
  it('should fetch organization members', async () => {
    authorizeStudio();
    const response = await request.get('/api/organizations/testorganization/members');

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

    authorizeStudio();
    const response = await request.get('/api/organizations/testorganization/invites');

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

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites', [
      { email: 'a@example.com' },
    ]);
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

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites', [
      { email: 'a@example.com' },
      { email: 'b@example.com' },
    ]);
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

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites', [
      { email: 'a@example.com' },
      { email: 'b@example.com' },
    ]);
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

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites', [
      { email: 'aa@example.com' },
    ]);
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
    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites', [
      { email: 'a@example.com' },
    ]);
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

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites/resend', {
      email: 'test2@example.com',
    });

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

    authorizeStudio();
    await request.post('/api/organizations/testorganization/invites', {
      email: 'test2@example.com',
    });

    const response = await request.post('/api/organizations/testorganization/invites/resend', {
      email: 'test2@example.com',
    });

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

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites/resend', {
      email: 'test2@example.com',
    });

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
    authorizeStudio();
    const response = await request.post('/api/organizations/foo/invites/resend', {
      email: 'test2@example.com',
    });

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

    authorizeStudio();
    const response = await request.delete('/api/organizations/testorganization/invites', {
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

    authorizeStudio();
    const response = await request.delete('/api/organizations/testorganization/invites', {
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
    authorizeStudio();
    const response = await request.delete('/api/organizations/testorganization/invites', {
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
    authorizeStudio();
    const response = await request.delete('/api/organizations/org/invites', {
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

    authorizeStudio();
    const result = await request.delete(`/api/organizations/testorganization/members/${user.id}`);

    expect(result.status).toBe(204);
  });

  it('should remove other members from an organization', async () => {
    const userB = await User.create();
    await Member.create({ UserId: userB.id, OrganizationId: organization.id, role: 'Member' });

    authorizeStudio();
    const { status } = await request.delete(
      `/api/organizations/testorganization/members/${userB.id}`,
    );

    expect(status).toBe(204);
  });

  it('should not remove the only remaining member in an organization', async () => {
    authorizeStudio();
    const response = await request.delete(`/api/organizations/testorganization/members/${user.id}`);

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
    authorizeStudio();
    const responseA = await request.delete(
      `/api/organizations/testorganization/members/${userB.id}`,
    );
    const responseB = await request.delete('/api/organizations/testorganization/members/0', {});

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

    authorizeStudio();
    const response = await request.put(
      `/api/organizations/testorganization/members/${userB.id}/role`,
      { role: 'AppEditor' },
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

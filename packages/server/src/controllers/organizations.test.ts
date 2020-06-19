import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';

import {
  BlockVersion,
  EmailAuthorization,
  Member,
  Organization,
  OrganizationBlockStyle,
  OrganizationInvite,
  User,
} from '../models';
import createServer from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';

let authorization: string;
let clientToken: string;
let organization: Organization;
let user: User;

beforeAll(createTestSchema('organizations'));

beforeAll(async () => {
  const server = await createServer({ argv: { host: 'http://localhost', secret: 'test' } });
  await setTestApp(server);
});

beforeEach(async () => {
  ({ authorization, clientToken, user } = await testToken('organizations:styles:write'));
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
  await Organization.create({ id: 'appsemble', name: 'Appsemble' });
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

describe('inviteMember', () => {
  it('should send an invite to an organization', async () => {
    await Member.update({ role: 'Maintainer' }, { where: { UserId: user.id } });
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    await userB.$create('User', { primaryEmail: 'test2@example.com', name: 'John' });
    const response = await request.post(
      '/api/organizations/testorganization/invites',
      { email: 'test2@example.com' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 201,
      data: {
        id: expect.any(String),
        name: 'John',
        primaryEmail: 'test2@example.com',
      },
    });
  });

  it('should not send an invite to an organization if the user does not have the right permissions', async () => {
    await Member.update({ role: 'AppEditor' }, { where: { UserId: user.id } });
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    await userB.$create('User', { primaryEmail: 'test2@example.com', name: 'John' });
    const response = await request.post(
      '/api/organizations/testorganization/invites',
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
  });

  it('should not send an invite for non-existent organizations', async () => {
    const response = await request.post(
      '/api/organizations/doesnotexist/invites',
      { email: 'test@example.com' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({ status: 404, data: { message: 'Organization not found.' } });
  });

  it('should not send an invite to an organization you are not a member of', async () => {
    await Organization.create({ id: 'org' });
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    await userB.$create('User', { primaryEmail: 'test2@example.com', name: 'John' });
    const response = await request.post(
      '/api/organizations/org/invites',
      { email: 'test2@example.com' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'Not allowed to invite users to organizations you are not a member of.' },
    });
  });

  it('should not send an invite to members of an organization', async () => {
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    const { id } = await userB.$create('User', { primaryEmail: 'test2@example.com', name: 'John' });
    await organization.$add('User', id);

    const response = await request.post(
      '/api/organizations/testorganization/invites',
      { email: 'test2@example.com' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 409,
      data: { message: 'User is already in this organization or has already been invited.' },
    });
  });
});

describe('resendInvitation', () => {
  it('should resend an invitation', async () => {
    await Member.update({ role: 'Maintainer' }, { where: { UserId: user.id } });
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

    expect(response).toMatchObject({ status: 204 });
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
  });
});

describe('removeInvite', () => {
  it('should revoke an invite', async () => {
    await Member.update({ role: 'Maintainer' }, { where: { UserId: user.id } });

    await request.post(
      '/api/organizations/testorganization/invites',
      { email: 'test2@example.com' },
      { headers: { authorization } },
    );

    const response = await request.delete('/api/organizations/testorganization/invites', {
      headers: { authorization },
      data: { email: 'test2@example.com' },
    });

    expect(response).toMatchObject({ status: 204 });
  });

  it('should not revoke an invite if the user does not have the right permissions', async () => {
    await request.post(
      '/api/organizations/testorganization/invites',
      { email: 'test2@example.com' },
      { headers: { authorization } },
    );

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

describe('getOrganizationcoreStyle', () => {
  it('should return an empty response on non-existent core stylesheets', async () => {
    const response = await request.get(`/api/organizations/${organization.id}/style/core`);

    expect(response).toMatchObject({
      status: 200,
      headers: { 'content-type': 'text/css; charset=utf-8' },
      data: '',
    });
  });
});

describe('setOrganizationCoreStyle', () => {
  it('should validate and update core stylesheets when uploading core stylesheets for an organization', async () => {
    const form = new FormData();
    form.append('style', Buffer.from('body { color: blue; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const responseA = await request.post(`/api/organizations/${organization.id}/style/core`, form, {
      headers: { ...form.getHeaders(), authorization: `Bearer ${clientToken}` },
    });

    const responseB = await request.get(`/api/organizations/${organization.id}/style/core`);

    expect(responseA.status).toBe(204);
    expect(responseB).toMatchObject({ status: 200, data: 'body { color: blue; }' });
  });

  it('should set core stylesheets to null when uploading empty stylesheets for an organization', async () => {
    const form = new FormData();
    form.append('style', Buffer.from('body { color: blue; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const responseA = await request.post(`/api/organizations/${organization.id}/style/core`, form, {
      headers: { ...form.getHeaders(), authorization: `Bearer ${clientToken}` },
    });

    const formB = new FormData();
    formB.append('style', Buffer.from(' '), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const responseB = await request.post(
      `/api/organizations/${organization.id}/style/core`,
      formB,
      {
        headers: { ...formB.getHeaders(), authorization: `Bearer ${clientToken}` },
      },
    );

    expect(responseA.status).toBe(204);
    expect(responseB.status).toBe(204);
    expect(organization.coreStyle).toBeNull();
  });

  it('should not allow invalid stylesheets when uploading core stylesheets to an organization', async () => {
    const form = new FormData();
    form.append('style', Buffer.from('invalid css'), {
      contentType: 'text/css',
      filename: 'style.css',
    });

    const response = await request.post(`/api/organizations/${organization.id}/style/core`, form, {
      headers: { ...form.getHeaders(), authorization: `Bearer ${clientToken}` },
    });
    expect(response).toMatchObject({
      status: 400,
      data: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Provided CSS was invalid.',
      },
    });
  });

  it('should not allow uploading core stylesheets to non-existent organizations', async () => {
    const form = new FormData();
    form.append('style', Buffer.from('body { color: red; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });

    const response = await request.post('/api/organizations/fake/style/core', form, {
      headers: { ...form.getHeaders(), authorization: `Bearer ${clientToken}` },
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'Organization not found.',
      },
    });
  });
});

describe('getOrganizationSharedStyle', () => {
  it('should return an empty response on non-existent shared stylesheets', async () => {
    const response = await request.get(`/api/organizations/${organization.id}/style/shared`);

    expect(response).toMatchObject({
      headers: { 'content-type': 'text/css; charset=utf-8' },
      status: 200,
      data: '',
    });
  });
});

describe('setOrganizationSharedStyle', () => {
  it('should validate and update shared stylesheets when uploading shared stylesheets for an organization', async () => {
    const form = new FormData();
    form.append('style', Buffer.from('body { color: red; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const responseA = await request.post(
      `/api/organizations/${organization.id}/style/shared`,
      form,
      {
        headers: { ...form.getHeaders(), authorization: `Bearer ${clientToken}` },
      },
    );

    const responseB = await request.get(`/api/organizations/${organization.id}/style/shared`);

    expect(responseA.status).toBe(204);
    expect(responseB).toMatchObject({ status: 200, data: 'body { color: red; }' });
  });

  it('should set shared stylesheets to null when uploading empty stylesheets for an organization', async () => {
    const form = new FormData();
    form.append('style', Buffer.from('body { color: blue; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const responseA = await request.post(`/api/organizations/${organization.id}/style/core`, form, {
      headers: { ...form.getHeaders(), authorization: `Bearer ${clientToken}` },
    });

    const formB = new FormData();
    formB.append('style', Buffer.from(' '), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const responseB = await request.post(
      `/api/organizations/${organization.id}/style/shared`,
      formB,
      { headers: { ...formB.getHeaders(), authorization: `Bearer ${clientToken}` } },
    );

    await organization.reload();

    expect(responseA.status).toBe(204);
    expect(responseB.status).toBe(204);
    expect(organization.sharedStyle).toBeNull();
  });

  it('should not allow invalid stylesheets when uploading shared stylesheets to an organization', async () => {
    const form = new FormData();
    form.append('style', Buffer.from('invalid css'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const response = await request.post(
      `/api/organizations/${organization.id}/style/shared`,
      form,
      {
        headers: { ...form.getHeaders(), authorization: `Bearer ${clientToken}` },
      },
    );

    expect(response).toMatchObject({
      status: 400,
      data: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Provided CSS was invalid.',
      },
    });
  });

  it('should not allow uploading shared stylesheets to non-existent organizations', async () => {
    const form = new FormData();
    form.append('style', Buffer.from('body { color: red; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const response = await request.post('/api/organizations/test/style/shared', form, {
      headers: { ...form.getHeaders(), authorization: `Bearer ${clientToken}` },
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'Organization not found.',
      },
    });
  });
});

describe('getOrganizationBlockStyle', () => {
  it('should return an empty response on non-existent block stylesheets', async () => {
    const response = await request.get(
      `/api/organizations/${organization.id}/style/block/@appsemble/doesntexist`,
    );

    expect(response).toMatchObject({
      status: 200,
      headers: {
        'content-type': 'text/css; charset=utf-8',
      },
      data: '',
    });
  });
});

describe('setOrganizationBlockStyle', () => {
  it('should validate and update block stylesheets when uploading block stylesheets for an organization', async () => {
    await BlockVersion.create({
      name: 'testblock',
      OrganizationId: 'appsemble',
      version: '0.0.0',
      description: 'This is a test block for testing purposes.',
    });

    const form = new FormData();
    form.append('style', Buffer.from('body { color: blue; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });

    const responseA = await request.post(
      `/api/organizations/${organization.id}/style/block/@appsemble/testblock`,
      form,
      { headers: { ...form.getHeaders(), authorization: `Bearer ${clientToken}` } },
    );

    const responseB = await request.get(
      `/api/organizations/${organization.id}/style/block/@appsemble/testblock`,
    );

    expect(responseA.status).toBe(204);
    expect(responseB).toMatchObject({ status: 200, data: 'body { color: blue; }' });
  });

  it('should set block stylesheets to null when uploading empty stylesheets for an organization', async () => {
    await BlockVersion.create({
      name: 'testblock',
      OrganizationId: 'appsemble',
      version: '0.0.0',
      description: 'This is a test block for testing purposes.',
    });

    const form = new FormData();
    form.append('style', Buffer.from('body { color: blue; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });

    const responseA = await request.post(
      `/api/organizations/${organization.id}/style/block/@appsemble/testblock`,
      form,
      { headers: { ...form.getHeaders(), authorization: `Bearer ${clientToken}` } },
    );

    const formB = new FormData();
    formB.append('style', Buffer.from(' '), {
      contentType: 'text/css',
      filename: 'style.css',
    });
    const responseB = await request.post(
      `/api/organizations/${organization.id}/style/block/@appsemble/testblock`,
      formB,
      { headers: { ...formB.getHeaders(), authorization: `Bearer ${clientToken}` } },
    );

    const style = await OrganizationBlockStyle.findOne({
      where: { OrganizationId: organization.id, block: '@appsemble/testblock' },
    });

    expect(responseA.status).toBe(204);
    expect(responseB.status).toBe(204);
    expect(style.style).toBeNull();
  });

  it('should not allow invalid stylesheets when uploading block stylesheets to an organization', async () => {
    await BlockVersion.create({
      name: 'testblock',
      OrganizationId: 'appsemble',
      version: '0.0.0',
      description: 'This is a test block for testing purposes.',
    });

    const form = new FormData();
    form.append('style', Buffer.from('invalid css'), {
      contentType: 'text/css',
      filename: 'style.css',
    });

    const response = await request.post(
      `/api/organizations/${organization.id}/style/block/@appsemble/testblock`,
      form,
      { headers: { ...form.getHeaders(), authorization: `Bearer ${clientToken}` } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Provided CSS was invalid.',
      },
    });
  });

  it('should not allow uploading block stylesheets to non-existent organizations', async () => {
    await BlockVersion.create({
      name: 'testblock',
      OrganizationId: 'appsemble',
      version: '0.0.0',
      description: 'This is a test block for testing purposes.',
    });

    const form = new FormData();
    form.append('style', Buffer.from('body { color: red; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });

    const response = await request.post(
      '/api/organizations/fake/style/block/@appsemble/testblock',
      form,
      { headers: { ...form.getHeaders(), authorization: `Bearer ${clientToken}` } },
    );

    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'Organization not found.',
      },
    });
  });

  it('should not allow uploading block stylesheets for non-existent blocks', async () => {
    const form = new FormData();
    form.append('style', Buffer.from('body { color: red; }'), {
      contentType: 'text/css',
      filename: 'style.css',
    });

    const response = await request.post(
      `/api/organizations/${organization.id}/style/block/@appsemble/doesntexist`,
      form,
      { headers: { ...form.getHeaders(), authorization: `Bearer ${clientToken}` } },
    );

    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'Block not found.',
      },
    });
  });
});

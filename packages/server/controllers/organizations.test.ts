import { randomBytes } from 'node:crypto';

import { createFormData, readFixture } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';
import type Koa from 'koa';

import {
  App,
  BlockVersion,
  EmailAuthorization,
  Member,
  Organization,
  OrganizationInvite,
  User,
} from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { organizationBlocklist } from '../utils/organizationBlocklist.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let organization: Organization;
let server: Koa;
let user: User;

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  import.meta.jest.useFakeTimers({ now: 0 });
  user = await createTestUser();
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
    icon: await readFixture('nodejs-logo.png'),
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
  await Organization.create({
    id: 'appsemble',
    name: 'Appsemble',
  });
  import.meta.jest.spyOn(server.context.mailer, 'sendTemplateEmail');
});

describe('getOrganizations', () => {
  it('should fetch all organizations with public apps or public blocks', async () => {
    await Organization.create({
      id: 'random',
      name: 'Random Organization',
    });
    await Organization.create({
      id: 'blocker',
      name: 'Organization with Blocks',
    });
    await Organization.create({
      id: 'private',
      name: 'Private organization with private apps and blocks',
    });
    await App.create({
      vapidPublicKey: '',
      vapidPrivateKey: '',
      OrganizationId: 'appsemble',
      visibility: 'public',
      definition: {
        defaultPage: '',
        resources: { testResource: { schema: { type: 'object' } } },
        pages: [
          {
            name: '',
            blocks: [],
          },
        ],
      },
    });
    await App.create({
      vapidPublicKey: '',
      vapidPrivateKey: '',
      OrganizationId: 'testorganization',
      visibility: 'public',
      definition: {
        defaultPage: '',
        resources: { testResource: { schema: { type: 'object' } } },
        pages: [
          {
            name: '',
            blocks: [],
          },
        ],
      },
    });
    await App.create({
      vapidPublicKey: '',
      vapidPrivateKey: '',
      OrganizationId: 'private',
      visibility: 'unlisted',
      definition: {
        defaultPage: '',
        resources: { testResource: { schema: { type: 'object' } } },
        pages: [
          {
            name: '',
            blocks: [],
          },
        ],
      },
    });
    await BlockVersion.create({
      name: 'test',
      version: '0.0.0',
      OrganizationId: 'blocker',
      parameters: {
        properties: {
          type: 'object',
          foo: {
            type: 'number',
          },
        },
      },
    });
    await BlockVersion.create({
      name: 'test',
      version: '0.0.0',
      OrganizationId: 'private',
      visibility: 'unlisted',
      parameters: {
        properties: {
          type: 'object',
          foo: {
            type: 'number',
          },
        },
      },
    });

    const response = await request.get('/api/organizations');

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: 'appsemble',
          name: 'Appsemble',
        },
        {
          id: 'blocker',
          name: 'Organization with Blocks',
        },
        {
          id: 'testorganization',
          name: 'Test Organization',
          iconUrl: '/api/organizations/testorganization/icon?updated=1970-01-01T00:00:00.000Z',
        },
      ],
    });
  });
});

describe('getOrganization', () => {
  it('should fetch an organization', async () => {
    authorizeStudio();
    const response = await request.get('/api/organizations/testorganization');

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: 'testorganization',
        name: 'Test Organization',
        iconUrl: '/api/organizations/testorganization/icon?updated=1970-01-01T00:00:00.000Z',
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

describe('getOrganizationApps', () => {
  it('should only return public organization apps', async () => {
    await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
      visibility: 'private',
    });
    await App.create({
      path: 'test-app-2',
      definition: { name: 'Test App 2', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
      visibility: 'unlisted',
    });
    const app = await App.create({
      path: 'test-app-3',
      definition: { name: 'Test App 3', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
      visibility: 'public',
    });

    const response = await request.get('/api/organizations/testorganization/apps');
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          OrganizationId: 'testorganization',
          definition: app.definition,
          iconUrl:
            '/api/organizations/testorganization/icon?background=%23ffffff&maskable=true&updated=1970-01-01T00%3A00%3A00.000Z',
          id: app.id,
          path: 'test-app-3',
          visibility: 'public',
        },
      ],
    });
  });

  it('should include unlisted and private organization apps if the user is part of the organization', async () => {
    authorizeStudio(user);
    const appA = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
      visibility: 'private',
    });
    const appB = await App.create({
      path: 'test-app-2',
      definition: { name: 'Test App 2', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
      visibility: 'unlisted',
    });
    const appC = await App.create({
      path: 'test-app-3',
      definition: { name: 'Test App 3', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
      visibility: 'public',
    });

    const response = await request.get('/api/organizations/testorganization/apps');
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          OrganizationId: 'testorganization',
          definition: appA.definition,
          iconUrl:
            '/api/organizations/testorganization/icon?background=%23ffffff&maskable=true&updated=1970-01-01T00%3A00%3A00.000Z',
          id: appA.id,
          locked: false,
          path: 'test-app',
          visibility: 'private',
        },
        {
          OrganizationId: 'testorganization',
          definition: appB.definition,
          iconUrl:
            '/api/organizations/testorganization/icon?background=%23ffffff&maskable=true&updated=1970-01-01T00%3A00%3A00.000Z',
          id: appB.id,
          locked: false,
          path: 'test-app-2',
          visibility: 'unlisted',
        },
        {
          OrganizationId: 'testorganization',
          definition: appC.definition,
          iconUrl:
            '/api/organizations/testorganization/icon?background=%23ffffff&maskable=true&updated=1970-01-01T00%3A00%3A00.000Z',
          id: appC.id,
          locked: false,
          path: 'test-app-3',
          visibility: 'public',
        },
      ],
    });
  });
});

describe('getOrganizationBlocks', () => {
  it('should return the organization’s public blocks', async () => {
    await BlockVersion.create({
      name: 'test',
      version: '0.0.0',
      OrganizationId: 'testorganization',
      parameters: {
        properties: {
          type: 'object',
          foo: {
            type: 'number',
          },
        },
      },
    });
    await BlockVersion.create({
      name: 'test-2',
      version: '0.0.0',
      OrganizationId: 'testorganization',
      visibility: 'unlisted',
      parameters: {
        properties: {
          type: 'object',
          foo: {
            type: 'number',
          },
        },
      },
    });

    const response = await request.get('/api/organizations/testorganization/blocks');

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          actions: null,
          description: null,
          events: null,
          iconUrl: '/api/organizations/testorganization/icon?updated=1970-01-01T00:00:00.000Z',
          layout: null,
          longDescription: null,
          name: '@testorganization/test',
          parameters: {
            properties: {
              foo: {
                type: 'number',
              },
              type: 'object',
            },
          },
          version: '0.0.0',
        },
      ],
    });
  });

  it('should include the organization’s private blocks if the user is logged in', async () => {
    authorizeStudio(user);
    await BlockVersion.create({
      name: 'test',
      version: '0.0.0',
      OrganizationId: 'testorganization',
      parameters: {
        properties: {
          type: 'object',
          foo: {
            type: 'number',
          },
        },
      },
    });
    await BlockVersion.create({
      name: 'test-2',
      version: '0.0.0',
      OrganizationId: 'testorganization',
      visibility: 'unlisted',
      parameters: {
        properties: {
          type: 'object',
          foo: {
            type: 'number',
          },
        },
      },
    });

    const response = await request.get('/api/organizations/testorganization/blocks');

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          actions: null,
          description: null,
          events: null,
          iconUrl: '/api/organizations/testorganization/icon?updated=1970-01-01T00:00:00.000Z',
          layout: null,
          longDescription: null,
          name: '@testorganization/test',
          parameters: {
            properties: {
              foo: {
                type: 'number',
              },
              type: 'object',
            },
          },
          version: '0.0.0',
        },
        {
          actions: null,
          description: null,
          events: null,
          iconUrl: '/api/organizations/testorganization/icon?updated=1970-01-01T00:00:00.000Z',
          layout: null,
          longDescription: null,
          name: '@testorganization/test-2',
          parameters: {
            properties: {
              foo: {
                type: 'number',
              },
              type: 'object',
            },
          },
          version: '0.0.0',
        },
      ],
    });
  });
});

describe('getOrganizationIcon', () => {
  it('should return the organization logo squared by default', async () => {
    const icon = await readFixture('tux.png');
    await organization.update({ icon });
    const response = await request.get(`/api/organizations/${organization.id}/icon`, {
      responseType: 'arraybuffer',
    });

    expect(response.data).toMatchImageSnapshot();
  });

  it('should set a background color if specified', async () => {
    const icon = await readFixture('tux.png');
    await organization.update({ icon });
    const response = await request.get(`/api/organizations/${organization.id}/icon`, {
      responseType: 'arraybuffer',
      params: { background: '#ffff00' },
    });

    expect(response.data).toMatchImageSnapshot();
  });

  it('should scale the icon is maskable is true', async () => {
    const icon = await readFixture('tux.png');
    await organization.update({ icon });
    const response = await request.get(`/api/organizations/${organization.id}/icon`, {
      responseType: 'arraybuffer',
      params: { maskable: true },
    });

    expect(response.data).toMatchImageSnapshot();
  });

  it('should be able to resize images', async () => {
    const icon = await readFixture('tux.png');
    await organization.update({ icon });
    const response = await request.get(`/api/organizations/${organization.id}/icon`, {
      responseType: 'arraybuffer',
      params: { size: 96 },
    });

    expect(response.data).toMatchImageSnapshot();
  });

  it('should be able to combine maskable, background, and size', async () => {
    const icon = await readFixture('tux.png');
    await organization.update({ icon });
    const response = await request.get(`/api/organizations/${organization.id}/icon`, {
      responseType: 'arraybuffer',
      params: { background: '#00ffff', maskable: true, size: 192 },
    });

    expect(response.data).toMatchImageSnapshot();
  });

  it('should be possible retrieve the raw icon', async () => {
    const icon = await readFixture('tux.png');
    await organization.update({ icon });
    const response = await request.get(`/api/organizations/${organization.id}/icon`, {
      responseType: 'arraybuffer',
      params: { raw: true },
    });

    expect(response.data).toStrictEqual(icon);
  });

  it('should have a fallback icon', async () => {
    await organization.update({ icon: null });
    const response = await request.get(`/api/organizations/${organization.id}/icon`, {
      responseType: 'arraybuffer',
      params: { raw: true },
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
    const response = await request.post(
      '/api/organizations',
      createFormData({ id: 'foo', name: 'Foooo' }),
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
        iconUrl: null,
        invites: [],
      },
    });
  });

  it('should create a new organization with an icon', async () => {
    authorizeStudio();
    const formData = createFormData({ id: 'foo', name: 'Foooo' });
    const buffer = await readFixture('testpattern.png');
    formData.append('icon', buffer, { filename: 'icon.png' });
    const response = await request.post('/api/organizations', formData);

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
        iconUrl: '/api/organizations/foo/icon?updated=1970-01-01T00:00:00.000Z',
        invites: [],
      },
    });
  });

  it('should not create a new organization if user is unverified', async () => {
    await EmailAuthorization.update({ verified: false }, { where: { UserId: user.id } });

    authorizeStudio();
    const response = await request.post(
      '/api/organizations',
      createFormData({ id: 'foo', name: 'Foooo' }),
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
    // This prevents the test from hanging and timing out
    import.meta.jest.useRealTimers();

    authorizeStudio();
    await request.post('/api/organizations', createFormData({ id: 'foo', name: 'Foooo' }));

    const response = await request.post(
      '/api/organizations',
      createFormData({ id: 'foo', name: 'Foooo' }),
    );

    expect(response).toMatchObject({
      status: 409,
      data: { message: 'Another organization with the id “foo” already exists' },
    });
  });

  it.each(organizationBlocklist)(
    'should not allow the organization id ‘%s’',
    async (blockedName) => {
      authorizeStudio();
      const response = await request.post(
        '/api/organizations',
        createFormData({ id: blockedName }),
      );
      expect(response).toMatchObject({
        status: 400,
        data: { message: 'This organization id is not allowed.' },
      });
    },
  );
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

  it('should should not fetch organization members if the user is not a member', async () => {
    authorizeStudio();
    await Organization.create({ id: 'org' });
    const response = await request.get('/api/organizations/org/members');

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User is not part of this organization.',
      },
    });
  });
});

describe('getInvites', () => {
  it('should fetch organization invites', async () => {
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    await userB.$create('User', {
      primaryEmail: 'test2@example.com',
      name: 'John',
      timezone: 'Europe/Amsterdam',
    });
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

  it('should return forbidden if the user is a member but does not have invite permissions', async () => {
    await Member.update({ role: 'Member' }, { where: { UserId: user.id } });
    const userB = await EmailAuthorization.create({ email: 'test2@example.com', verified: true });
    await userB.$create('User', {
      primaryEmail: 'test2@example.com',
      name: 'John',
      timezone: 'Europe/Amsterdam',
    });
    await OrganizationInvite.create({
      email: 'test2@example.com',
      key: 'abcde',
      OrganizationId: 'testorganization',
    });

    authorizeStudio();
    const response = await request.get('/api/organizations/testorganization/invites');

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User does not have sufficient permissions.',
      },
    });
  });
});

describe('inviteMembers', () => {
  it('should require the InviteMember permission', async () => {
    await Member.update({ role: 'Member' }, { where: { UserId: user.id } });

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites', [
      { email: 'a@example.com', role: 'Member' },
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
    const userA = await User.create({
      primaryEmail: 'a@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await EmailAuthorization.create({ UserId: userA.id, email: 'a@example.com' });
    await Member.create({ OrganizationId: organization.id, UserId: userA.id });

    const userB = await User.create({
      primaryEmail: 'b@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await EmailAuthorization.create({ UserId: userB.id, email: 'b@example.com' });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id });

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites', [
      { email: 'a@example.com', role: 'Member' },
      { email: 'b@example.com', role: 'Member' },
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
    const userA = await User.create({
      primaryEmail: 'a@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await EmailAuthorization.create({ UserId: userA.id, email: 'a@example.com' });
    await Member.create({ OrganizationId: organization.id, UserId: userA.id });

    await OrganizationInvite.create({
      OrganizationId: organization.id,
      email: 'b@example.com',
      key: randomBytes(20).toString('hex'),
    });

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites', [
      { email: 'a@example.com', role: 'Member' },
      { email: 'b@example.com', role: 'Member' },
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
    const userA = await User.create({
      primaryEmail: 'a@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await EmailAuthorization.create({ UserId: userA.id, email: 'a@example.com' });
    await EmailAuthorization.create({ UserId: userA.id, email: 'aa@example.com' });

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites', [
      { email: 'aa@example.com', role: 'Member' },
    ]);
    const invite = await OrganizationInvite.findOne();

    expect(response).toMatchObject({
      status: 201,
      data: [{ email: 'a@example.com', role: 'Member' }],
    });
    expect(invite).toMatchObject({
      email: 'a@example.com',
      key: expect.stringMatching(/^\w{40}$/),
      OrganizationId: 'testorganization',
      UserId: userA.id,
      role: 'Member',
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
      { email: 'a@example.com', role: 'Member' },
    ]);
    const invite = await OrganizationInvite.findOne();

    expect(response).toMatchObject({
      status: 201,
      data: [{ email: 'a@example.com', role: 'Member' }],
    });
    expect(invite).toMatchObject({
      email: 'a@example.com',
      key: expect.stringMatching(/^\w{40}$/),
      OrganizationId: 'testorganization',
      UserId: null,
      role: 'Member',
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
      role: 'Member',
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
    await userB.$create('User', {
      primaryEmail: 'test2@example.com',
      name: 'John',
      timezone: 'Europe/Amsterdam',
    });

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
    await userB.$create('User', {
      primaryEmail: 'test2@example.com',
      name: 'John',
      timezone: 'Europe/Amsterdam',
    });

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
      role: 'Member',
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
      role: 'Member',
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
    await userB.$create('User', {
      primaryEmail: 'test2@example.com',
      name: 'John',
      timezone: 'Europe/Amsterdam',
    });
    await OrganizationInvite.create({
      email: 'test2@example.com',
      key: 'abcde',
      role: 'Member',
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

    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    await Member.create({ UserId: userB.id, OrganizationId: organization.id, role: 'Member' });

    authorizeStudio();
    const result = await request.delete(`/api/organizations/testorganization/members/${user.id}`);

    expect(result.status).toBe(204);
  });

  it('should remove other members from an organization', async () => {
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
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
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
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
    const userB = await User.create({
      name: 'Foo',
      primaryEmail: 'test2@example.com',
      timezone: 'Europe/Amsterdam',
    });
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

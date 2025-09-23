import { PredefinedOrganizationRole } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  BlockVersion,
  getAppDB,
  Organization,
  OrganizationMember,
  User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let organization: Organization;
let user: User;

describe('queryAppMembers', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });

    await Organization.create({ id: 'appsemble', name: 'Appsemble' });
    await BlockVersion.create({
      name: 'test',
      version: '0.0.0',
      OrganizationId: 'appsemble',
      parameters: {
        properties: {
          type: 'object',
          foo: {
            type: 'number',
          },
        },
      },
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should fetch app members', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const { AppMember } = await getAppDB(app.id);
    await AppMember.create({
      userId: user.id,
      name: 'Test Member',
      email: 'member@example.com',
      role: 'Admin',
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/members`);
    expect(response).toMatchInlineSnapshot(
      {
        data: [
          {
            picture: expect.any(String),
            sub: expect.stringMatching(uuid4Pattern),
          },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$ephemeral": false,
          "$seed": false,
          "demo": false,
          "email": "member@example.com",
          "email_verified": false,
          "locale": null,
          "name": "Test Member",
          "phoneNumber": null,
          "picture": Any<String>,
          "properties": {},
          "role": "Admin",
          "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "zoneinfo": null,
        },
      ]
    `,
    );
  });

  it('should fetch app members by roles', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Staff',
            policy: 'everyone',
          },
          roles: {
            User: {},
            Staff: {},
            Manager: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const user1 = await User.create({
      primaryEmail: 'user@example.com',
      timezone: 'whatever',
    });

    const user2 = await User.create({
      primaryEmail: 'staff@example.com',
      timezone: 'whatever',
    });

    const user3 = await User.create({
      primaryEmail: 'manager@example.com',
      timezone: 'whatever',
    });

    const { AppMember } = await getAppDB(app.id);
    await AppMember.create({
      userId: user1.id,
      name: 'Test Member',
      email: 'user@example.com',
      role: 'User',
    });

    await AppMember.create({
      userId: user2.id,
      name: 'Test Member',
      email: 'staff@example.com',
      role: 'Staff',
    });

    await AppMember.create({
      userId: user3.id,
      name: 'Test Member',
      email: 'manager@example.com',
      role: 'Manager',
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/members?roles=Staff,Manager`);
    expect(response).toMatchInlineSnapshot(
      {
        data: [
          {
            picture: expect.any(String),
            sub: expect.stringMatching(uuid4Pattern),
          },
          {
            picture: expect.any(String),
            sub: expect.stringMatching(uuid4Pattern),
          },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$ephemeral": false,
          "$seed": false,
          "demo": false,
          "email": "manager@example.com",
          "email_verified": false,
          "locale": null,
          "name": "Test Member",
          "phoneNumber": null,
          "picture": Any<String>,
          "properties": {},
          "role": "Manager",
          "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "zoneinfo": null,
        },
        {
          "$ephemeral": false,
          "$seed": false,
          "demo": false,
          "email": "staff@example.com",
          "email_verified": false,
          "locale": null,
          "name": "Test Member",
          "phoneNumber": null,
          "picture": Any<String>,
          "properties": {},
          "role": "Staff",
          "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "zoneinfo": null,
        },
      ]
    `,
    );
  });

  it('should allow filtering app members using oDataFilters', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Staff',
            policy: 'everyone',
          },
          roles: {
            Staff: {},
            Manager: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const user1 = await User.create({
      primaryEmail: 'staff@example.com',
      timezone: 'whatever',
    });

    const user2 = await User.create({
      primaryEmail: 'manager@example.com',
      timezone: 'whatever',
    });

    await AppMember.create({
      UserId: user1.id,
      AppId: app.id,
      name: 'Test Member',
      email: 'staff@example.com',
      role: 'Staff',
    });

    await AppMember.create({
      UserId: user2.id,
      AppId: app.id,
      name: 'Test Member',
      email: 'manager@example.com',
      role: 'Manager',
    });

    await AppMember.create({
      AppId: app.id,
      name: 'Test Not Filtered',
      email: 'notFiltered@example.com',
      role: 'Member',
    });

    authorizeStudio();
    const response = await request.get(
      `/api/apps/${app.id}/members?$filter=contains(name, 'Test Member')`,
    );
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual([
      {
        sub: expect.any(String),
        name: 'Test Member',
        phoneNumber: null,
        email: 'manager@example.com',
        email_verified: false,
        picture: expect.stringContaining('https://www.gravatar.com/avatar'),
        locale: null,
        zoneinfo: null,
        properties: {},
        role: 'Manager',
        demo: false,
        $seed: false,
        $ephemeral: false,
      },
      {
        sub: expect.any(String),
        name: 'Test Member',
        phoneNumber: null,
        email: 'staff@example.com',
        email_verified: false,
        picture: expect.stringContaining('https://www.gravatar.com/avatar'),
        locale: null,
        zoneinfo: null,
        properties: {},
        role: 'Staff',
        demo: false,
        $seed: false,
        $ephemeral: false,
      },
    ]);
  });

  it('should fetch app members by a single role', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Staff',
            policy: 'everyone',
          },
          roles: {
            Staff: {},
            Manager: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const user1 = await User.create({
      primaryEmail: 'staff@example.com',
      timezone: 'whatever',
    });

    const user2 = await User.create({
      primaryEmail: 'manager@example.com',
      timezone: 'whatever',
    });

    const { AppMember } = await getAppDB(app.id);
    await AppMember.create({
      userId: user1.id,
      name: 'Test Member',
      email: 'staff@example.com',
      role: 'Staff',
    });

    await AppMember.create({
      userId: user2.id,
      name: 'Test Member',
      email: 'manager@example.com',
      role: 'Manager',
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/members?roles=Staff`);
    expect(response).toMatchInlineSnapshot(
      {
        data: [
          {
            picture: expect.any(String),
            sub: expect.stringMatching(uuid4Pattern),
          },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$ephemeral": false,
          "$seed": false,
          "demo": false,
          "email": "staff@example.com",
          "email_verified": false,
          "locale": null,
          "name": "Test Member",
          "phoneNumber": null,
          "picture": Any<String>,
          "properties": {},
          "role": "Staff",
          "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "zoneinfo": null,
        },
      ]
    `,
    );
  });

  it('should fetch app members by no roles', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Staff',
            policy: 'everyone',
          },
          roles: {
            Staff: {},
            Manager: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const user1 = await User.create({
      primaryEmail: 'staff@example.com',
      timezone: 'whatever',
    });

    const user2 = await User.create({
      primaryEmail: 'manager@example.com',
      timezone: 'whatever',
    });

    const { AppMember } = await getAppDB(app.id);
    await AppMember.create({
      userId: user1.id,
      name: 'Test Member',
      email: 'staff@example.com',
      role: 'Staff',
    });

    await AppMember.create({
      userId: user2.id,
      name: 'Test Member',
      email: 'manager@example.com',
      role: 'Manager',
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/members?roles=`);
    expect(response).toMatchInlineSnapshot(
      {
        data: [
          {
            picture: expect.any(String),
            sub: expect.stringMatching(uuid4Pattern),
          },
          {
            picture: expect.any(String),
            sub: expect.stringMatching(uuid4Pattern),
          },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$ephemeral": false,
          "$seed": false,
          "demo": false,
          "email": "manager@example.com",
          "email_verified": false,
          "locale": null,
          "name": "Test Member",
          "phoneNumber": null,
          "picture": Any<String>,
          "properties": {},
          "role": "Manager",
          "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "zoneinfo": null,
        },
        {
          "$ephemeral": false,
          "$seed": false,
          "demo": false,
          "email": "staff@example.com",
          "email_verified": false,
          "locale": null,
          "name": "Test Member",
          "phoneNumber": null,
          "picture": Any<String>,
          "properties": {},
          "role": "Staff",
          "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "zoneinfo": null,
        },
      ]
    `,
    );
  });

  it('should only return invited members if policy is set to invite', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'invite',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/members`);
    expect(response).toMatchObject({
      status: 200,
      data: [],
    });
  });
});

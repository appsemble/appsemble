import { createFixtureStream, createFormData, readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { jwtPattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { compare } from 'bcrypt';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppMember,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { createTestUser } from '../../../../utils/test/authorization.js';
import { createDefaultAppWithSecurity } from '../../../../utils/test/defaultAppSecurity.js';

let organization: Organization;
let user: User;

describe('registerAppMemberWithEmail', () => {
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

  it('should register valid email addresses', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Admin',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
            Admin: {},
          },
        },
        users: {
          properties: {
            foo: {
              schema: {
                type: 'string',
              },
            },
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const response = await request.post(
      `/api/apps/${app.id}/auth/email/register`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        timezone: 'Europe/Amsterdam',
        properties: {
          foo: 'bar',
        },
      }),
    );

    expect(response).toMatchInlineSnapshot(
      {
        data: {
          access_token: expect.stringMatching(jwtPattern),
          refresh_token: expect.stringMatching(jwtPattern),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "access_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "expires_in": 3600,
        "refresh_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "token_type": "bearer",
      }
    `,
    );

    const m = (await AppMember.findOne({ where: { email: 'test@example.com' } }))!;

    expect(m.password).not.toBe('password');
    expect(await compare('password', m.password!)).toBe(true);
  });

  it('should accept a display name', async () => {
    const app = await createDefaultAppWithSecurity(organization);

    const response = await request.post(
      `/api/apps/${app.id}/auth/email/register`,
      createFormData({
        email: 'test@example.com',
        name: 'Me',
        password: 'password',
        timezone: 'Europe/Amsterdam',
      }),
    );

    expect(response).toMatchInlineSnapshot(
      {
        data: {
          access_token: expect.stringMatching(jwtPattern),
          refresh_token: expect.stringMatching(jwtPattern),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "access_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "expires_in": 3600,
        "refresh_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "token_type": "bearer",
      }
    `,
    );

    const m = (await AppMember.findOne({ where: { email: 'test@example.com' } }))!;
    expect(m.name).toBe('Me');
  });

  it('should accept a profile picture', async () => {
    const app = await createDefaultAppWithSecurity(organization);

    const response = await request.post(
      `/api/apps/${app.id}/auth/email/register`,
      createFormData({
        email: 'test@example.com',
        name: 'Me',
        password: 'password',
        picture: createFixtureStream('tux.png'),
        timezone: 'Europe/Amsterdam',
      }),
    );

    const m = (await AppMember.findOne({ where: { email: 'test@example.com' } }))!;

    const responseB = await request.get(`/api/app-members/${m.id}/picture`, {
      responseType: 'arraybuffer',
    });
    expect(response).toMatchInlineSnapshot(
      {
        data: {
          access_token: expect.stringMatching(jwtPattern),
          refresh_token: expect.stringMatching(jwtPattern),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "access_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "expires_in": 3600,
        "refresh_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "token_type": "bearer",
      }
    `,
    );
    expect(m.picture).toStrictEqual(await readFixture('tux.png'));
    expect(responseB.data).toStrictEqual(await readFixture('tux.png'));
  });

  it('should not register invalid email addresses', async () => {
    const app = await createDefaultAppWithSecurity(organization);

    const response = await request.post(
      `/api/apps/${app.id}/auth/email/register`,
      createFormData({ email: 'foo', password: 'bar', timezone: 'Europe/Amsterdam' }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": "email",
            "instance": "foo",
            "message": "does not conform to the "email" format",
            "name": "format",
            "path": [
              "email",
            ],
            "property": "instance.email",
            "schema": {
              "format": "email",
              "type": "string",
            },
            "stack": "instance.email does not conform to the "email" format",
          },
          {
            "argument": 8,
            "instance": "bar",
            "message": "does not meet minimum length of 8",
            "name": "minLength",
            "path": [
              "password",
            ],
            "property": "instance.password",
            "schema": {
              "minLength": 8,
              "type": "string",
            },
            "stack": "instance.password does not meet minimum length of 8",
          },
        ],
        "message": "Invalid content types found",
      }
    `);
  });

  it('should not register duplicate email addresses', async () => {
    const app = await createDefaultAppWithSecurity(organization);

    await AppMember.create({
      AppId: app.id,
      UserId: user.id,
      role: 'User',
      email: 'test@example.com',
    });

    const response = await request.post(
      `/api/apps/${app.id}/auth/email/register`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        timezone: 'Europe/Amsterdam',
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 409 Conflict
      Content-Type: application/json; charset=utf-8

      {
        "error": "Conflict",
        "message": "App member with this email address already exists.",
        "statusCode": 409,
      }
    `);
  });

  it('should throw if the app definition does not have phoneNumber enabled', async () => {
    const app = await createDefaultAppWithSecurity(organization);
    await app.update({
      definition: {
        ...app.definition,
        members: { phoneNumber: { enable: false } },
      },
    });
    const response = await request.post(
      `/api/apps/${app.id}/auth/email/register`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        timezone: 'Europe/Amsterdam',
        phoneNumber: '+31 612345678',
      }),
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "App does not allow registering phone numbers",
        "statusCode": 400,
      }
    `);
  });

  it('should throw if phoneNumber is omitted', async () => {
    const app = await createDefaultAppWithSecurity(organization);
    await app.update({
      definition: {
        ...app.definition,
        members: { phoneNumber: { enable: true, required: true } },
      },
    });
    const response = await request.post(
      `/api/apps/${app.id}/auth/email/register`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        timezone: 'Europe/Amsterdam',
      }),
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Phone number is required for registering with this app",
        "statusCode": 400,
      }
    `);
  });

  it('should throw for duplicate phone numbers', async () => {
    const app = await createDefaultAppWithSecurity(organization);
    await app.update({
      definition: {
        ...app.definition,
        members: { phoneNumber: { enable: true } },
      },
    });
    await AppMember.create({
      AppId: app.id,
      UserId: user.id,
      role: 'User',
      email: 'test@example.com',
      phoneNumber: '+31612345678',
    });

    const response = await request.post(
      `/api/apps/${app.id}/auth/email/register`,
      createFormData({
        email: 'test2@example.com',
        password: 'password',
        timezone: 'Europe/Amsterdam',
        phoneNumber: '+31 612345678',
      }),
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 409 Conflict
      Content-Type: application/json; charset=utf-8

      {
        "error": "Conflict",
        "message": "App member with this phone number already exists.",
        "statusCode": 409,
      }
    `);
  });

  it('should create an app member with a phone number', async () => {
    const app = await createDefaultAppWithSecurity(organization);
    await app.update({
      definition: {
        ...app.definition,
        members: { phoneNumber: { enable: true } },
      },
    });
    const response = await request.post(
      `/api/apps/${app.id}/auth/email/register`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        timezone: 'Europe/Amsterdam',
        phoneNumber: '+31 612345678',
      }),
    );

    expect(response.status).toBe(201);

    const appMember = await AppMember.findOne({
      where: { AppId: app.id, phoneNumber: '+31 6 12345678' },
    });
    expect(appMember?.dataValues).toMatchObject({
      email: 'test@example.com',
      timezone: 'Europe/Amsterdam',
      phoneNumber: '+31 6 12345678',
    });
  });
});

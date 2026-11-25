import { createFixtureStream, createFormData, readFixture } from '@appsemble/node-utils';
import { type AppMemberInfo } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  type AppMember,
  BlockVersion,
  getAppDB,
  Organization,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeAppMember, createTestAppMember } from '../../../../utils/test/authorization.js';

let app: App;
let appMember: AppMember;

describe('patchCurrentAppMember', () => {
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

    const organization = await Organization.create({ id: 'appsemble', name: 'Appsemble' });

    app = await App.create({
      OrganizationId: organization.id,
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });

    appMember = await createTestAppMember(app.id);

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

  it('should update and return the app member', async () => {
    authorizeAppMember(app);

    const response = await request.patch(
      `/api/apps/${app.id}/members/current`,
      createFormData({ name: 'Me', properties: { test: 'Property' } }),
    );

    expect(response.data).toMatchInlineSnapshot(
      { sub: expect.stringMatching(uuid4Pattern) },
      `
      {
        "$ephemeral": false,
        "$seed": false,
        "demo": false,
        "email": "test@example.com",
        "email_verified": false,
        "locale": "en",
        "name": "Me",
        "phoneNumber": null,
        "picture": "https://www.gravatar.com/avatar/55502f40dc8b7c769880b10874abc9d0?s=128&d=mp",
        "properties": {
          "test": "Property",
        },
        "roles": [
          "Member",
        ],
        "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "totpEnabled": false,
        "zoneinfo": "Europe/Amsterdam",
      }
    `,
    );
    await appMember.reload();
    expect(appMember.name).toBe('Me');
    expect(appMember.email).toBe('test@example.com');
  });

  it('should authenticate app API calls using the returned app access token', async () => {
    const tokenResponse = await request.post(
      `/apps/${app.id}/auth/oauth2/token`,
      new URLSearchParams({
        client_id: `app:${app.id}`,
        grant_type: 'password',
        password: 'testpassword',
        scope: 'email groups:read groups:write openid profile resources:manage',
        username: 'test@example.com',
      }),
    );

    const response = await request.patch(
      `/api/apps/${app.id}/members/current`,
      createFormData({ name: 'Cookie Authenticated' }),
      {
        headers: {
          authorization: `Bearer ${tokenResponse.data.access_token}`,
        },
      },
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        email: 'test@example.com',
        name: 'Cookie Authenticated',
      },
    });
    await appMember.reload();
    expect(appMember.name).toBe('Cookie Authenticated');
  });

  it('should not over write the app member properties', async () => {
    await appMember.update({
      properties: {
        foo: 'bar',
      },
    });

    authorizeAppMember(app);
    const { status } = await request.patch<AppMemberInfo>(
      `/api/apps/${app.id}/members/current`,
      createFormData({
        properties: {
          hello: 'world',
        },
      }),
    );
    expect(status).toBe(200);
    await appMember.reload();
    expect(appMember.properties).toMatchObject({
      foo: 'bar',
      hello: 'world',
    });
  });

  it('should allow for updating the profile picture', async () => {
    authorizeAppMember(app);

    const response = await request.patch<AppMemberInfo>(
      `/api/apps/${app.id}/members/current`,
      createFormData({
        name: 'Me',
        picture: createFixtureStream('tux.png'),
      }),
    );

    expect(response.data).toMatchInlineSnapshot(
      { sub: expect.stringMatching(uuid4Pattern), picture: expect.any(String) },
      `
      {
        "$ephemeral": false,
        "$seed": false,
        "demo": false,
        "email": "test@example.com",
        "email_verified": false,
        "locale": "en",
        "name": "Me",
        "phoneNumber": null,
        "picture": Any<String>,
        "properties": {},
        "roles": [
          "Member",
        ],
        "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "totpEnabled": false,
        "zoneinfo": "Europe/Amsterdam",
      }
    `,
    );
    expect(response.data.picture).toBe(
      `http://localhost/api/apps/${app.id}/app-members/${appMember.id}/picture?updated=0`,
    );
    await appMember.reload();
    expect(appMember.picture).toStrictEqual(await readFixture('tux.png'));
  });

  it('should allow for removing the profile picture', async () => {
    await appMember.update({ picture: await readFixture('tux.png') });
    authorizeAppMember(app);

    const response = await request.patch<AppMemberInfo>(
      `/api/apps/${app.id}/members/current`,
      createFormData({
        name: 'Me',
        picture: '',
      }),
    );
    expect(response.data).toMatchInlineSnapshot(
      { sub: expect.stringMatching(uuid4Pattern), picture: expect.any(String) },
      `
      {
        "$ephemeral": false,
        "$seed": false,
        "demo": false,
        "email": "test@example.com",
        "email_verified": false,
        "locale": "en",
        "name": "Me",
        "phoneNumber": null,
        "picture": Any<String>,
        "properties": {},
        "roles": [
          "Member",
        ],
        "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "totpEnabled": false,
        "zoneinfo": "Europe/Amsterdam",
      }
    `,
    );
    expect(response.data.picture).toMatch(/https:\/\/www\.gravatar\.com\/avatar\/.*/gm);
    await appMember.reload();
    expect(appMember.picture).toBeNull();
  });

  it('should reject an invalid phone number', async () => {
    await app.update({ definition: { members: { phoneNumber: { enable: true } } } });
    authorizeAppMember(app);

    const response = await request.patch(
      `/api/apps/${app.id}/members/current`,
      createFormData({ phoneNumber: '+3112345678901' }),
    );

    expect(response).toMatchObject({ status: 400, data: { message: 'Invalid Phone Number' } });
  });

  it('should not report success if the update fails', async () => {
    authorizeAppMember(app);

    const { status } = await request.patch(
      `/api/apps/${app.id}/members/current`,
      createFormData({ name: 'a'.repeat(256) }),
    );

    expect(status).toBe(500);
  });

  it('should update an app member who has a property that was removed from the app', async () => {
    const changedApp = await App.create({
      OrganizationId: 'appsemble',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: { members: { properties: { department: { schema: { type: 'string' } } } } },
    });
    const { AppMember: Member } = await getAppDB(changedApp.id);
    const member = await createTestAppMember(changedApp.id);
    await Member.update({ properties: { removed: 'value' } }, { where: { id: member.id } });
    authorizeAppMember(changedApp, member);

    const { status } = await request.patch(
      `/api/apps/${changedApp.id}/members/current`,
      createFormData({ name: 'Me' }),
    );

    await member.reload();
    expect({ status, name: member.name, properties: member.properties }).toStrictEqual({
      status: 200,
      name: 'Me',
      properties: { removed: 'value' },
    });
  });

  it('should only accept references to ephemeral resources in demo apps', async () => {
    const demoApp = await App.create({
      OrganizationId: 'appsemble',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      demoMode: true,
      definition: {
        members: {
          properties: { task: { schema: { type: 'integer' }, reference: { resource: 'tasks' } } },
        },
        resources: { tasks: { schema: { type: 'object' } } },
      },
    });
    const { Resource } = await getAppDB(demoApp.id);
    const seedTask = await Resource.create({ type: 'tasks', seed: true, data: {} });
    const ephemeralTask = await Resource.create({ type: 'tasks', ephemeral: true, data: {} });
    const member = await createTestAppMember(demoApp.id);
    authorizeAppMember(demoApp, member);

    const statuses: number[] = [];
    for (const task of [seedTask.id, ephemeralTask.id]) {
      const { status } = await request.patch(
        `/api/apps/${demoApp.id}/members/current`,
        createFormData({ properties: { task: String(task) } }),
      );
      statuses.push(status);
    }

    expect(statuses).toStrictEqual([400, 200]);
  });

  it('should throw 404 if the app doesn’t exist', async () => {
    authorizeAppMember(app);

    const response = await request.patch(
      '/api/apps/404/members/current',
      createFormData({ name: '' }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App not found",
        "statusCode": 404,
      }
    `);
  });
});

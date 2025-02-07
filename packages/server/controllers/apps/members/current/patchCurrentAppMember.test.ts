import { createFixtureStream, createFormData, readFixture } from '@appsemble/node-utils';
import { type AppMemberInfo } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, type AppMember, BlockVersion, Organization } from '../../../../models/index.js';
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
        "demo": false,
        "email": "test@example.com",
        "email_verified": false,
        "locale": "en",
        "name": "Me",
        "picture": "https://www.gravatar.com/avatar/55502f40dc8b7c769880b10874abc9d0?s=128&d=mp",
        "properties": {
          "test": "Property",
        },
        "role": "Member",
        "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "zoneinfo": "Europe/Amsterdam",
      }
    `,
    );
    await appMember.reload();
    expect(appMember.name).toBe('Me');
    expect(appMember.email).toBe('test@example.com');
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
        "demo": false,
        "email": "test@example.com",
        "email_verified": false,
        "locale": "en",
        "name": "Me",
        "picture": Any<String>,
        "properties": {},
        "role": "Member",
        "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "zoneinfo": "Europe/Amsterdam",
      }
    `,
    );
    expect(response.data.picture).toBe(
      `http://localhost/api/app-members/${appMember.id}/picture?updated=0`,
    );
    await appMember.reload();
    expect(appMember.picture).toStrictEqual(await readFixture('tux.png'));
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

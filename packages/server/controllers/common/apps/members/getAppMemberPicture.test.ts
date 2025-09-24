import { createFixtureStream, createFormData, readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BlockVersion,
  getAppDB,
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

describe('getAppMemberPicture', () => {
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

  it('should fetch the app member’s profile picture', async () => {
    const app = await createDefaultAppWithSecurity(organization);
    await request.post(
      `/api/apps/${app.id}/auth/email/register`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        picture: createFixtureStream('tux.png'),
        timezone: 'Europe/Amsterdam',
      }),
    );

    const { AppMember } = await getAppDB(app.id);
    const m = (await AppMember.findOne({ where: { email: 'test@example.com' } }))!;
    const response = await request.get(`/api/apps/${app.id}/app-members/${m.id}/picture`, {
      responseType: 'arraybuffer',
    });

    expect(response.data).toStrictEqual(await readFixture('tux.png'));
  });

  it('should return 404 if the user has not uploaded a picture', async () => {
    const app = await createDefaultAppWithSecurity(organization);
    await request.post(
      `/api/apps/${app.id}/auth/email/register`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        timezone: 'Europe/Amsterdam',
      }),
    );

    const { AppMember } = await getAppDB(app.id);
    const m = (await AppMember.findOne({ where: { email: 'test@example.com' } }))!;
    const response = await request.get(`/api/apps/${app.id}/app-members/${m.id}/picture`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "This member has no profile picture set.",
        "statusCode": 404,
      }
    `);
  });
});

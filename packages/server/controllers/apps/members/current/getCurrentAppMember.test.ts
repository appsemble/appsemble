import { createFormData } from '@appsemble/node-utils';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, BlockVersion, Organization } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeAppMember, createTestAppMember } from '../../../../utils/test/authorization.js';

let app: App;

describe('getCurrentAppMember', () => {
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

    await createTestAppMember(app.id);

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

  it('should return the app member', async () => {
    authorizeAppMember(app);

    const response = await request.get(`/api/apps/${app.id}/members/current`);

    expect(response.data).toMatchInlineSnapshot(
      { sub: expect.stringMatching(uuid4Pattern) },
      `
      {
        "demo": false,
        "email": "test@example.com",
        "email_verified": false,
        "locale": "en",
        "name": "Test App Member",
        "picture": "https://www.gravatar.com/avatar/55502f40dc8b7c769880b10874abc9d0?s=128&d=mp",
        "properties": {},
        "role": "Member",
        "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "zoneinfo": "Europe/Amsterdam",
      }
    `,
    );
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

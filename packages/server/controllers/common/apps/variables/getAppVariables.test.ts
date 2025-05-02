import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let app: App;
let user: User;
const date = new Date('2000-01-01').toISOString();
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('getAppVariables', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv(argv);
    const server = await createServer({});
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(date);
    user = await createTestUser();
    const organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          groups: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
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
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    authorizeStudio();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should get app variables', async () => {
    const { AppVariable } = await getAppDB(app.id);
    await AppVariable.create({
      name: 'Test variable',
      value: 'Test value',
    });
    await AppVariable.create({
      name: 'Test variable 2',
      value: 'Test value 2',
    });

    const response = await request.get(`/api/apps/${app.id}/variables`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "id": 1,
          "name": "Test variable",
          "value": "Test value",
        },
        {
          "id": 2,
          "name": "Test variable 2",
          "value": "Test value 2",
        },
      ]
    `);
  });

  it('should throw status 404 for unknown apps', async () => {
    authorizeStudio();
    const response = await request.get('/api/apps/123/variables');
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

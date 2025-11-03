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
let member: OrganizationMember;
const date = new Date('2000-01-01').toISOString();
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('updateAppVariable', () => {
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
    member = await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    authorizeStudio();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should update a single app variable', async () => {
    const { AppVariable } = await getAppDB(app.id);
    await AppVariable.create({
      name: 'Test variable',
      value: 'Test value',
    });
    await AppVariable.create({
      name: 'Test variable 2',
      value: 'Test value 2',
    });

    const response = await request.put(`/api/apps/${app.id}/variables/2`, {
      name: 'Test variable 3',
      value: 'Test value 3',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "id": 2,
        "name": "Test variable 3",
        "value": "Test value 3",
      }
    `);
  });

  it('should update the value of a variable and keep the name', async () => {
    const { AppVariable } = await getAppDB(app.id);
    await AppVariable.create({
      name: 'Test variable',
      value: 'Test value',
    });
    await AppVariable.create({
      name: 'Test variable 2',
      value: 'Test value 2',
    });

    const response = await request.put(`/api/apps/${app.id}/variables/2`, {
      name: 'Test variable 2',
      value: 'Test value 3',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "id": 2,
        "name": "Test variable 2",
        "value": "Test value 3",
      }
    `);
  });

  it('should not allow duplicate variable names', async () => {
    const { AppVariable } = await getAppDB(app.id);
    await AppVariable.create({
      name: 'Test variable',
      value: 'Test value',
    });
    await AppVariable.create({
      name: 'Test variable 2',
      value: 'Test value 2',
    });

    const response = await request.put(`/api/apps/${app.id}/variables/2`, {
      name: 'Test variable',
      value: 'Test value updated',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "App variable with name Test variable already exists",
        "statusCode": 400,
      }
    `);
  });

  it('should throw status 404 for unknown variables', async () => {
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/variables/123`, {
      name: 'Test variable 2',
      value: 'Test value 2',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Cannot find the app variable to update",
        "statusCode": 404,
      }
    `);
  });

  it('should throw status 404 for unknown apps', async () => {
    authorizeStudio();
    const response = await request.put('/api/apps/123/variables/1', {
      name: 'Test variable 2',
      value: 'Test value 2',
    });
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

  it('should require the EditApps and EditAppSettings permissions', async () => {
    authorizeStudio();
    await member.update({ role: 'Member' });
    const response = await request.put(`/api/apps/${app.id}/variables/123`, {
      name: 'Test variable',
      value: 'Test value',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient organization permissions.",
        "statusCode": 403,
      }
    `);
  });
});

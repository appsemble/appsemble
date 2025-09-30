import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let app: App;
let user: User;
let member: OrganizationMember;
const date = new Date('2000-01-01').toISOString();
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('deleteAppServiceSecrets', () => {
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

  it('should delete all app service secrets', async () => {
    const { AppServiceSecret } = await getAppDB(app.id);
    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: 'example.com',
      authenticationMethod: 'query',
      identifier: 'key',
      secret: 'c6a5e780dee8e2f1f576538c8',
    });
    await AppServiceSecret.create({
      name: 'Test service 2',
      urlPatterns: 'example.com',
      authenticationMethod: 'query',
      identifier: 'key 2',
      secret: 'c6a5e780dee8e2f1f576538c9',
    });

    const response = await request.delete(`/api/apps/${app.id}/secrets/service`);

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should require the EditApps and EditAppSettings permissions', async () => {
    authorizeStudio();
    await member.update({ role: 'Member' });
    const response = await request.delete(`/api/apps/${app.id}/secrets/service`);
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

import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppServiceSecret,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let app: App;
let user: User;
const date = new Date('2000-01-01').toISOString();
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('getAppServiceSecrets', () => {
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

  it('should get app service secrets', async () => {
    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: 'example.com',
      authenticationMethod: 'query',
      identifier: 'key',
      secret: 'c6a5e780dee8e2f1f576538c8',
      AppId: app.id,
    });
    await AppServiceSecret.create({
      name: 'Test service',
      urlPatterns: 'example.com',
      authenticationMethod: 'basic',
      identifier: 'john_doe',
      secret: 'Strong_Password-123',
      AppId: app.id,
    });

    const response = await request.get(`/api/apps/${app.id}/secrets/service`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "authenticationMethod": "query",
          "ca": null,
          "id": 1,
          "identifier": "key",
          "name": "Test service",
          "scope": null,
          "tokenUrl": null,
          "urlPatterns": "example.com",
        },
        {
          "authenticationMethod": "basic",
          "ca": null,
          "id": 2,
          "identifier": "john_doe",
          "name": "Test service",
          "scope": null,
          "tokenUrl": null,
          "urlPatterns": "example.com",
        },
      ]
    `);
  });
});

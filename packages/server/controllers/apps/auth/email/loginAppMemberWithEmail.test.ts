import { basicAuth } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { jwtPattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { createTestUser } from '../../../../utils/test/authorization.js';

let organization: Organization;
let user: User;
let app: App;

describe('loginAppMemberWithEmail', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test', aesSecret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
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

    app = await App.create({
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
      totp: 'disabled',
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should return tokens when the app does not use TOTP', async () => {
    const response = await request.post(
      `/api/apps/${app.id}/auth/email/login`,
      {},
      { headers: { authorization: basicAuth('test@example.com', 'testpassword') } },
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        access_token: expect.stringMatching(jwtPattern),
        refresh_token: expect.stringMatching(jwtPattern),
        token_type: 'bearer',
      },
    });
  });

  it('should enforce TOTP before issuing tokens', async () => {
    await app.update({ totp: 'required' });

    const response = await request.post(
      `/api/apps/${app.id}/auth/email/login`,
      {},
      { headers: { authorization: basicAuth('test@example.com', 'testpassword') } },
    );

    expect(response.status).toBe(401);
    expect(response.data).toMatchObject({
      error: 'Unauthorized',
      message: 'TOTP verification required',
      data: {
        totpRequired: true,
        totpEnabled: false,
        totpToken: expect.stringMatching(jwtPattern),
      },
    });
  });
});

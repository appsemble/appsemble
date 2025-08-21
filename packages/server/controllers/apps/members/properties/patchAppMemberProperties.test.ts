import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { createFormData } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
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
import {
  authorizeAppMember,
  createTestAppMember,
  createTestUser,
} from '../../../../utils/test/authorization.js';

let organization: Organization;
let user: User;

describe('patchAppMemberProperties', () => {
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

  it('should update and return the app member properties', async () => {
    const app = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    const owner = await createTestAppMember(app.id);
    authorizeAppMember(app, owner);
    const appMember = await AppMember.create({
      email: 'test2@example.com',
      AppId: app.id,
      role: PredefinedAppRole.Member,
    });

    const response = await request.patch(
      `/api/app-members/${appMember.id}/properties`,
      createFormData({ properties: { test: 'Property', foo: 'bar' } }),
    );

    expect(response).toMatchInlineSnapshot(
      { data: { sub: expect.stringMatching(uuid4Pattern) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "demo": false,
        "email": "test2@example.com",
        "email_verified": false,
        "locale": null,
        "name": null,
        "phoneNumber": null,
        "picture": "https://www.gravatar.com/avatar/43b05f394d5611c54a1a9e8e20baee21?s=128&d=mp",
        "properties": {
          "foo": "bar",
          "test": "Property",
        },
        "role": "Member",
        "sub": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "zoneinfo": null,
      }
    `,
    );
  });

  it('should not update the existing properties that are not in the request body', async () => {
    const app = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    await createTestAppMember(app.id);
    authorizeAppMember(app);
    const appMember = await AppMember.create({
      email: 'test2@example.com',
      AppId: app.id,
      role: PredefinedAppRole.Member,
      properties: { foo: 'bar', number: 33 },
    });

    const { status } = await request.patch(
      `/api/app-members/${appMember.id}/properties`,
      createFormData({ properties: { foo: 'test' } }),
    );
    expect(status).toBe(200);
    await appMember.reload();
    expect(appMember.properties).toStrictEqual({ foo: 'test', number: 33 });
  });
});

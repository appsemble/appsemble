import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, Organization, OrganizationMember } from '../../../../../models/index.js';
import { argv, setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { decrypt } from '../../../../../utils/crypto.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let app: App;

describe('updateAppScimSecret', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test', aesSecret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    vi.useFakeTimers().setSystemTime(new Date('2000-01-01'));
    const user = await createTestUser();
    const organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    app = await App.create({
      OrganizationId: organization.id,
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  it('should be secure', async () => {
    const response = await request.get(`/api/apps/${app.id}/secrets/scim`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: text/plain; charset=utf-8

      Unauthorized
    `);
  });

  it('should update whether SCIM is enabled', async () => {
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/secrets/scim`, {
      enabled: true,
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "enabled": true,
        "token": null,
      }
    `);

    await app.reload();
    expect(app.scimEnabled).toBe(true);
  });

  it('should update the SCIM token', async () => {
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/secrets/scim`, {
      token: '6789',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "enabled": false,
        "token": "6789",
      }
    `);

    await app.reload();
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    expect(decrypt(app.scimToken, argv.aesSecret)).toBe('6789');
  });
});

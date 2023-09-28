import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, Member, Organization } from '../models/index.js';
import { argv, setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { decrypt, encrypt } from '../utils/crypto.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let app: App;

useTestDatabase(import.meta);

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
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
});

describe('getAppScimSecret', () => {
  it('should be secure', async () => {
    const response = await request.get(`/api/apps/${app.id}/secrets/scim`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: text/plain; charset=utf-8

      Unauthorized
    `);
  });

  it('should get the SCIM secret', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/secrets/scim`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "enabled": false,
      }
    `);
  });

  it('should get the SCIM token', async () => {
    authorizeStudio();
    await app.update({ scimEnabled: true, scimToken: encrypt('1234', argv.aesSecret) });

    const response = await request.get(`/api/apps/${app.id}/secrets/scim`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "enabled": true,
        "token": "1234",
      }
    `);
  });
});

describe('updateAppScimSecret', () => {
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
    const response = await request.patch(`/api/apps/${app.id}/secrets/scim`, { enabled: true });

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
    const response = await request.patch(`/api/apps/${app.id}/secrets/scim`, { token: '6789' });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "enabled": false,
        "token": "6789",
      }
    `);

    await app.reload();
    expect(decrypt(app.scimToken, argv.aesSecret)).toBe('6789');
  });
});

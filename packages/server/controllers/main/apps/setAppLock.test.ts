import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, Organization, OrganizationMember, type User } from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import {
  authorizeClientCredentials,
  authorizeStudio,
  createTestUser,
} from '../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../utils/test/testSchema.js';

let organization: Organization;
let user: User;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

useTestDatabase(import.meta);

beforeAll(async () => {
  vi.useFakeTimers();
  setArgv(argv);
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
});

afterAll(() => {
  vi.useRealTimers();
});

describe('setAppLock', () => {
  it('should set the locked property to studioLock', async () => {
    authorizeStudio();
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const response = await request.post(`/api/apps/${app.id}/lock`, { locked: 'studioLock' });
    await app.reload();
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(app.locked).toBe('studioLock');
  });

  it('should set the locked property to unlocked', async () => {
    authorizeStudio();
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      locked: 'studioLock',
    });

    const response = await request.post(`/api/apps/${app.id}/lock`, { locked: 'unlocked' });
    await app.reload();
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(app.locked).toBe('unlocked');
  });

  it('should set the locked property to fullLock', async () => {
    authorizeStudio();
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      locked: 'studioLock',
    });

    const response = await request.post(`/api/apps/${app.id}/lock`, { locked: 'fullLock' });
    await app.reload();
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(app.locked).toBe('fullLock');
  });

  it('should not be possible to change fullLock except from CLI', async () => {
    authorizeStudio();
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      locked: 'fullLock',
    });

    const response = await request.post(`/api/apps/${app.id}/lock`, { locked: 'unlocked' });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "This app can only be unlocked from the CLI.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow to change fullLock from CLI', async () => {
    await authorizeClientCredentials('apps:write');
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      locked: 'fullLock',
    });

    const response = await request.post(`/api/apps/${app.id}/lock`, { locked: 'unlocked' });
    await app.reload();
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(app.locked).toBe('unlocked');
  });

  it('should not be possible to set the lock status as an app translator', async () => {
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.AppTranslator },
      { where: { UserId: user.id } },
    );

    authorizeStudio();
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      locked: 'studioLock',
    });

    const response = await request.post(`/api/apps/${app.id}/lock`, { locked: 'unlocked' });
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

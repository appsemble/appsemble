import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, Organization, OrganizationMember, type User } from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';
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

describe('deleteAppMaskableIcon', () => {
  it('should delete existing app maskable icons', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      maskableIcon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/maskable-icon`);
    await app.reload();
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(app.maskableIcon).toBeNull();
  });

  it('should not delete maskable icons from non-existent apps', async () => {
    authorizeStudio();
    const response = await request.delete('/api/apps/0/maskable-icon');
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

  it('should not delete non-existent maskable icons from apps', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/maskable-icon`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App has no maskable icon",
        "statusCode": 404,
      }
    `);
  });
});

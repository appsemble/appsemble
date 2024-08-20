import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppScreenshot,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

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

describe('deleteAppScreenshot', () => {
  it('should delete existing screenshots', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const buffer = await readFixture('standing.png');
    const screenshot = await AppScreenshot.create({
      AppId: app.id,
      screenshot: buffer,
      width: 427,
      height: 247,
      mime: 'image/png',
    });

    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/screenshots/${screenshot.id}`);

    const screenshots = await AppScreenshot.count();

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/plain; charset=utf-8

      OK
    `);
    expect(screenshots).toBe(0);
  });

  it('should return 404 when trying to delete screenshots with IDs that don’t exist', async () => {
    const app = await App.create({
      definition: {},
      OrganizationId: organization.id,
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/screenshots/0`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Screenshot not found",
        "statusCode": 404,
      }
    `);
  });
});

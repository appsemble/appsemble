import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole, type Snapshot } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppSnapshot,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let organization: Organization;
let user: User;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('getAppSnapshots', () => {
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

  it('should return a list of app snapshots', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    await AppSnapshot.create({
      AppId: app.id,
      UserId: user.id,
      yaml: "name: Test App\ndefaultPage: 'Test Page'",
    });
    vi.useRealTimers();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    vi.advanceTimersByTime(60_000);
    await AppSnapshot.create({
      AppId: app.id,
      UserId: user.id,
      yaml: "name: Test App\ndefaultPage: 'Test Page'",
    });

    authorizeStudio(user);
    const response = await request.get<Snapshot[]>(`/api/apps/${app.id}/snapshots`);

    expect(response).toMatchInlineSnapshot(
      { data: [{ $author: { id: expect.any(String) } }, { $author: { id: expect.any(String) } }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$author": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$created": "1970-01-01T00:01:00.000Z",
          "id": 2,
        },
        {
          "$author": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$created": "1970-01-01T00:00:00.000Z",
          "id": 1,
        },
      ]
    `,
    );
    expect(response.data[0].$author.id).toBe(user.id);
    expect(response.data[1].$author.id).toBe(user.id);
  });
});

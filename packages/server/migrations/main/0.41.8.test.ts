import { type AppAccount, PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, describe, expect, it } from 'vitest';

import { down, up } from './0.41.8.js';
import {
  App,
  getAppDB,
  getDB,
  Organization,
  OrganizationMember,
  User,
} from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';
import { createServer } from '../../utils/createServer.js';
import {
  authorizeStudio,
  createTestAppMember,
  createTestUser,
} from '../../utils/test/authorization.js';

function createApp(path: string): Promise<App> {
  return App.create({
    OrganizationId: 'org',
    path,
    definition: {
      name: path,
      defaultPage: 'Home',
      security: { default: { role: 'User', policy: 'everyone' }, roles: { User: {} } },
    },
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
  });
}

async function signIn(user: User, app: App): Promise<void> {
  authorizeStudio(user);
  const response = await request.post(
    `/api/users/current/auth/oauth2/apps/${app.id}/consent/agree`,
    { redirectUri: `http://${app.path}.org.localhost`, scope: 'openid' },
  );
  expect(response.status).toBe(201);
}

async function getAccountAppIds(user: User): Promise<number[]> {
  authorizeStudio(user);
  const response = await request.get<AppAccount[]>('/api/users/current/apps/accounts');
  expect(response.status).toBe(200);
  return response.data.map(({ app }) => app.id!).sort((a, b) => a - b);
}

describe('migration 0.41.8', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' });
    const server = await createServer();
    await setTestApp(server);
  });

  it('should record the app accounts of existing app members like signing in does', async () => {
    const owner = await createTestUser();
    const other = await createTestUser('other@example.com');
    const deleted = await createTestUser('deleted@example.com');
    await Organization.create({ id: 'org', name: 'Test Organization' });
    await OrganizationMember.create({
      OrganizationId: 'org',
      UserId: owner.id,
      role: PredefinedOrganizationRole.Owner,
    });
    const notes = await createApp('notes');
    const tasks = await createApp('tasks');
    const survey = await createApp('survey');
    await signIn(owner, notes);
    await signIn(owner, tasks);
    await signIn(other, tasks);
    await signIn(deleted, survey);
    await createTestAppMember(survey.id, 'member@example.com');
    // The app member keeps the id of its deleted user in the app database.
    await User.destroy({ where: { id: deleted.id }, force: true });
    const live = { owner: await getAccountAppIds(owner), other: await getAccountAppIds(other) };

    const db = getDB();
    await db.transaction(async (transaction) => {
      await down(transaction, db);
      await up(transaction, db);
    });
    // Reopen the app database the migration closed, so the test teardown drops its tables.
    await getAppDB(survey.id);
    const backfilled = {
      owner: await getAccountAppIds(owner),
      other: await getAccountAppIds(other),
    };

    const expected = { owner: [notes.id, tasks.id], other: [tasks.id] };
    expect({ live, backfilled }).toStrictEqual({ live: expected, backfilled: expected });
  });
});

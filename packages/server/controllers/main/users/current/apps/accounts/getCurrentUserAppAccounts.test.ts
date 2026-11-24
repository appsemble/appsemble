import { type AppAccount, PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  closeAppDB,
  getAppDB,
  Organization,
  OrganizationMember,
  User,
} from '../../../../../../models/index.js';
import { setArgv } from '../../../../../../utils/argv.js';
import { createServer } from '../../../../../../utils/createServer.js';
import {
  authorizeAppMember,
  authorizeStudio,
  createTestAppMember,
  createTestUser,
} from '../../../../../../utils/test/authorization.js';

let owner: User;

function createApp(path: string, dbPort?: number): Promise<App> {
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
    dbPort,
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

async function getAppAccounts(user: User): Promise<AppAccount[]> {
  authorizeStudio(user);
  const response = await request.get<AppAccount[]>('/api/users/current/apps/accounts');
  expect(response.status).toBe(200);
  return response.data;
}

async function getAccountAppIds(user: User): Promise<number[]> {
  const accounts = await getAppAccounts(user);
  return accounts.map(({ app }) => app.id!).sort((a, b) => a - b);
}

describe('getCurrentUserAppAccounts', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    owner = await createTestUser();
    await Organization.create({ id: 'org', name: 'Test Organization' });
    await OrganizationMember.create({
      OrganizationId: 'org',
      UserId: owner.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  it('should return an empty array if there are no connected apps', async () => {
    authorizeStudio();
    const response = await request.get('/api/users/current/apps/accounts');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      []
    `);
  });

  it('should return the app member account of the user in a connected app', async () => {
    const app = await createApp('notes');
    await signIn(owner, app);

    expect(await getAppAccounts(owner)).toStrictEqual([
      {
        app: expect.objectContaining({ id: app.id, OrganizationName: 'Test Organization' }),
        appMemberInfo: expect.objectContaining({ email: 'test@example.com', name: 'Test User' }),
        sso: [],
      },
    ]);
  });

  it('should return exactly the apps each user signed in to', async () => {
    const other = await createTestUser('other@example.com');
    const notes = await createApp('notes');
    const tasks = await createApp('tasks');
    const survey = await createApp('survey');
    await createApp('unused');
    await signIn(owner, notes);
    await signIn(owner, tasks);
    await signIn(other, tasks);
    await signIn(other, survey);

    expect({
      owner: await getAccountAppIds(owner),
      other: await getAccountAppIds(other),
    }).toStrictEqual({ owner: [notes.id, tasks.id], other: [tasks.id, survey.id] });
  });

  it('should not open the database of an app the user has no account in', async () => {
    const notes = await createApp('notes');
    await createApp('unreachable', 1);
    await signIn(owner, notes);

    expect(await getAccountAppIds(owner)).toStrictEqual([notes.id]);
  });

  it('should list an app after an existing app member signs in with Appsemble', async () => {
    const app = await createApp('notes');
    const { AppMember } = await getAppDB(app.id);
    await AppMember.create({
      email: owner.primaryEmail,
      role: 'User',
      userId: owner.id,
      consent: new Date(),
    });

    authorizeStudio(owner);
    const response = await request.post(
      `/api/users/current/auth/oauth2/apps/${app.id}/consent/verify`,
      { redirectUri: 'http://notes.org.localhost', scope: 'openid' },
    );

    expect(response.status).toBe(200);
    expect(await getAccountAppIds(owner)).toStrictEqual([app.id]);
  });

  it('should list an app after an app member links the Appsemble account', async () => {
    const app = await createApp('notes');
    const appMember = await createTestAppMember(app.id, owner.primaryEmail);

    authorizeAppMember(app, appMember);
    const response = await request.post(`/api/apps/${app.id}/members/current/link`, {
      email: owner.primaryEmail,
      externalId: owner.id,
      secret: 'user:',
    });

    expect(response.status).toBe(200);
    expect(await getAccountAppIds(owner)).toStrictEqual([app.id]);
  });

  it('should stop listing and opening an app after the app member of the user is deleted', async () => {
    const other = await createTestUser('other@example.com');
    const notes = await createApp('notes');
    const tasks = await createApp('tasks');
    await signIn(other, notes);
    await signIn(other, tasks);
    const accounts = await getAppAccounts(other);
    const notesMemberId = accounts.find(({ app }) => app.id === notes.id)!.appMemberInfo.sub;

    authorizeStudio(owner);
    const response = await request.delete(`/api/apps/${notes.id}/app-members/${notesMemberId}`);
    const listed = await getAccountAppIds(other);
    const { dbPort } = notes;
    await notes.update({ dbPort: 1 });
    await closeAppDB(notes.id);
    const listedWithUnreachableDatabase = await getAccountAppIds(other);
    // Reopen the app database, so the test teardown drops its tables.
    await notes.update({ dbPort });
    await getAppDB(notes.id);

    expect({ status: response.status, listed, listedWithUnreachableDatabase }).toStrictEqual({
      status: 204,
      listed: [tasks.id],
      listedWithUnreachableDatabase: [tasks.id],
    });
  });

  it('should not list an app after it is deleted', async () => {
    const notes = await createApp('notes');
    const tasks = await createApp('tasks');
    await signIn(owner, notes);
    await signIn(owner, tasks);

    authorizeStudio(owner);
    const response = await request.delete(`/api/apps/${notes.id}`);

    expect(response.status).toBe(204);
    expect(await getAccountAppIds(owner)).toStrictEqual([tasks.id]);
  });

  it('should permanently delete users and apps that have app accounts', async () => {
    const other = await createTestUser('other@example.com');
    const notes = await createApp('notes');
    const tasks = await createApp('tasks');
    await signIn(owner, notes);
    await signIn(other, tasks);

    await User.destroy({ where: { id: other.id }, force: true });
    await App.destroy({ where: { id: notes.id }, force: true });

    expect({
      users: await User.count({ where: { id: other.id }, paranoid: false }),
      apps: await App.count({ where: { id: notes.id }, paranoid: false }),
    }).toStrictEqual({ users: 0, apps: 0 });
  });
});

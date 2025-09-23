import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import webpush from 'web-push';

import {
  type App,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
import { exampleApp } from '../../../../utils/test/exampleApp.js';

let organization: Organization;
let user: User;
let app: App;
let originalSendNotification: typeof webpush.sendNotification;

describe('deleteAppSeedResources', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
    originalSendNotification = webpush.sendNotification;
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
      UserId: user.id,
      OrganizationId: organization.id,
      role: 'Maintainer',
    });
    app = await exampleApp(organization.id);
  });

  afterAll(() => {
    webpush.sendNotification = originalSendNotification;
    vi.useRealTimers();
  });

  it('should delete seed resources in all apps', async () => {
    authorizeStudio();

    const { Resource } = await getAppDB(app.id);
    await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      seed: true,
    });

    await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      seed: true,
    });

    await request.delete(`/api/apps/${app.id}/resources`);

    const seedResources = await Resource.findAll({
      where: {
        seed: true,
      },
    });

    expect(seedResources).toStrictEqual([]);
  });

  it('should delete seed resources and ephemeral resources in demo apps', async () => {
    await app.update({ demoMode: true });
    authorizeStudio();

    const { Resource } = await getAppDB(app.id);
    await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      seed: true,
    });

    await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      seed: true,
    });

    await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      ephemeral: true,
    });

    await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      ephemeral: true,
    });

    await request.delete(`/api/apps/${app.id}/resources`);

    const seedResources = await Resource.findAll({
      where: {
        seed: true,
      },
    });

    expect(seedResources).toStrictEqual([]);

    const ephemeralResources = await Resource.findAll({
      where: {
        ephemeral: true,
      },
    });

    expect(ephemeralResources).toStrictEqual([]);
  });

  it('should delete seed resources with references in all apps', async () => {
    authorizeStudio();

    const { Resource } = await getAppDB(app.id);
    const testResource = await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      seed: true,
    });

    const testResourceB = await Resource.create({
      type: 'testResourceB',
      data: { foo: 'I am Foo.', testResourceId: testResource.id },
      seed: true,
    });

    await Resource.create({
      type: 'testResourceBB',
      data: { foo: 'I am Foo.', testResourceBId: testResourceB.id },
      seed: true,
    });

    await request.delete(`/api/apps/${app.id}/resources`);

    const seedResources = await Resource.findAll({
      where: {
        seed: true,
      },
    });

    expect(seedResources).toStrictEqual([]);
  });

  it('should delete seed resources and ephemeral resources with references in demo apps', async () => {
    await app.update({ demoMode: true });
    authorizeStudio();

    const { Resource } = await getAppDB(app.id);
    const seedTestResource = await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      seed: true,
    });

    const seedTestResourceB = await Resource.create({
      type: 'testResourceB',
      data: { foo: 'I am Foo.', testResourceId: seedTestResource.id },
      seed: true,
    });

    await Resource.create({
      type: 'testResourceBB',
      data: { foo: 'I am Foo.', testResourceBId: seedTestResourceB.id },
      seed: true,
    });

    const ephemeralTestResource = await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      ephemeral: true,
    });

    const ephemeralTestResourceB = await Resource.create({
      type: 'testResourceB',
      data: { foo: 'I am Foo.', testResourceId: ephemeralTestResource.id },
      seed: true,
    });

    await Resource.create({
      type: 'testResourceBB',
      data: { foo: 'I am Foo.', testResourceBId: ephemeralTestResourceB.id },
      seed: true,
    });

    await request.delete(`/api/apps/${app.id}/resources`);

    const seedResources = await Resource.findAll({
      where: {
        seed: true,
      },
    });

    expect(seedResources).toStrictEqual([]);

    const ephemeralResources = await Resource.findAll({
      where: {
        ephemeral: true,
      },
    });

    expect(ephemeralResources).toStrictEqual([]);
  });
});

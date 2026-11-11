import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppMessages,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let organization: Organization;
let server: Koa;
let user: User;

describe('getOrganizationApps', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
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
      icon: await readFixture('nodejs-logo.png'),
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  it('should only return public organization apps', async () => {
    await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
      visibility: 'private',
    });
    await App.create({
      path: 'test-app-2',
      definition: { name: 'Test App 2', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
      visibility: 'unlisted',
    });
    const app = await App.create({
      path: 'test-app-3',
      definition: { name: 'Test App 3', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
      visibility: 'public',
    });

    const response = await request.get('/api/organizations/testorganization/apps');
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          OrganizationId: 'testorganization',
          definition: app.definition,
          iconUrl:
            '/api/organizations/testorganization/icon?background=%23ffffff&maskable=true&updated=1970-01-01T00%3A00%3A00.000Z',
          id: app.id,
          path: 'test-app-3',
          visibility: 'public',
        },
      ],
    });
  });

  it.each([
    undefined,
    PredefinedOrganizationRole.Member,
    PredefinedOrganizationRole.AppMemberManager,
  ])(
    'should protect app content in organization listings without app query permission (%s)',
    async (role) => {
      const app = await App.create({
        path: 'protected',
        definition: { name: 'Test App', pages: [] },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
        password: 'hash',
        controllerCode: 'private code',
      });
      await AppMessages.create({
        AppId: app.id,
        language: 'nl',
        messages: { messageIds: { secret: 'Private text' } },
      });
      if (role) {
        await OrganizationMember.update({ role }, { where: { UserId: user.id } });
        authorizeStudio(user);
      }
      const canQueryApps = role === PredefinedOrganizationRole.Member;

      const response = await request.get(`/api/organizations/${organization.id}/apps?language=nl`);

      expect([
        response.status,
        response.data[0].definition,
        response.data[0].messages?.messageIds,
        response.data[0].controllerCode,
      ]).toStrictEqual([
        200,
        canQueryApps ? { name: 'Test App', pages: [] } : { name: 'Test App' },
        canQueryApps ? { secret: 'Private text' } : undefined,
        canQueryApps ? 'private code' : undefined,
      ]);
    },
  );

  it('should include unlisted and private organization apps if the user is part of the organization', async () => {
    authorizeStudio(user);
    const appA = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
      visibility: 'private',
    });
    const appB = await App.create({
      path: 'test-app-2',
      definition: { name: 'Test App 2', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
      visibility: 'unlisted',
    });
    const appC = await App.create({
      path: 'test-app-3',
      definition: { name: 'Test App 3', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
      visibility: 'public',
    });

    const response = await request.get('/api/organizations/testorganization/apps');
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          OrganizationId: 'testorganization',
          definition: appA.definition,
          iconUrl:
            '/api/organizations/testorganization/icon?background=%23ffffff&maskable=true&updated=1970-01-01T00%3A00%3A00.000Z',
          id: appA.id,
          locked: 'unlocked',
          path: 'test-app',
          visibility: 'private',
        },
        {
          OrganizationId: 'testorganization',
          definition: appB.definition,
          iconUrl:
            '/api/organizations/testorganization/icon?background=%23ffffff&maskable=true&updated=1970-01-01T00%3A00%3A00.000Z',
          id: appB.id,
          locked: 'unlocked',
          path: 'test-app-2',
          visibility: 'unlisted',
        },
        {
          OrganizationId: 'testorganization',
          definition: appC.definition,
          iconUrl:
            '/api/organizations/testorganization/icon?background=%23ffffff&maskable=true&updated=1970-01-01T00%3A00%3A00.000Z',
          id: appC.id,
          locked: 'unlocked',
          path: 'test-app-3',
          visibility: 'public',
        },
      ],
    });
  });
});

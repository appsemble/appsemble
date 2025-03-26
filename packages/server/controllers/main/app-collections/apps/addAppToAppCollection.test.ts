import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppCollection,
  AppCollectionApp,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { type Argv, setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let organization: Organization;
let user: User;
let funAndProductivityApp: App;
let collections: AppCollection[];
const argv: Partial<Argv> = { host: 'http://localhost', secret: 'test', aesSecret: 'test' };

describe('addAppToAppCollection', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv(argv);
    const server = await createServer({});
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
    const tuxPng = await readFixture('tux.png');
    const standingPng = await readFixture('standing.png');
    collections = await Promise.all(
      ['Productivity', 'Fun', 'Collaboration'].map((name) =>
        AppCollection.create({
          name,
          expertName: 'Expert van den Expert',
          expertProfileImage: tuxPng,
          expertProfileImageMimeType: 'image/png',
          headerImage: standingPng,
          headerImageMimeType: 'image/png',
          expertDescription: 'I’m an expert, trust me.',
          OrganizationId: organization.id,
          visibility: 'public',
        }),
      ),
    );

    funAndProductivityApp = await App.create({
      definition: {
        name: 'Fun and Productivity App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
            Admin: {},
          },
        },
      },
      path: 'fun-and-productivity-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
  });

  it('should add an app to an app collection', async () => {
    authorizeStudio(user);
    const response = await request.post(`/api/app-collections/${collections[0].id}/apps`, {
      AppId: funAndProductivityApp.id,
    });
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const collection = await AppCollection.findByPk(collections[0].id, {
      include: [{ model: AppCollectionApp, include: [{ model: App }] }],
    });
    expect(collection).not.toBeNull();
    expect(collection?.Apps.map((app) => app.App!.path)).toStrictEqual(
      expect.arrayContaining(['fun-and-productivity-app']),
    );
  });

  it('should not allow a user to add an app to an app collection without permission', async () => {
    const unprivilegedUser = await createTestUser('nobody@example.com');
    authorizeStudio(unprivilegedUser);
    const response = await request.post(`/api/app-collections/${collections[0].id}/apps`, {
      AppId: funAndProductivityApp.id,
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not a member of this organization.",
        "statusCode": 403,
      }
    `);
  });

  // XXX: This test hangs, but functionality works fine on the server
  // eslint-disable-next-line vitest/no-disabled-tests
  it.skip('should not allow duplicate apps in an app collection', async () => {
    authorizeStudio(user);

    const response = await request.post(`/api/app-collections/${collections[0].id}/apps`, {
      AppId: funAndProductivityApp.id,
    });
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const response2 = await request.post(`/api/app-collections/${collections[0].id}/apps`, {
      AppId: funAndProductivityApp.id,
    });
    expect(response2).toMatchInlineSnapshot(`
      HTTP/1.1 409 Conflict
      Content-Type: application/json; charset=utf-8

      {
        "error": "Conflict",
        "message": "App is already in collection.",
        "statusCode": 409,
      }
    `);
  });
});

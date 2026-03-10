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
let apps: App[];
let collections: AppCollection[];
const argv: Partial<Argv> = { host: 'http://localhost', secret: 'test', aesSecret: 'test' };

describe('unpinAppFromAppCollection', () => {
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
      id: String(Math.floor(100_000 + Math.random() * 900_000)),
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    apps = await Promise.all(
      [
        'Productivity and Collaboration App',
        'Fun and Collaboration App',
        'Productivity App',
        'Fun App',
      ].map((name) =>
        App.create({
          definition: {
            name,
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
          path: name.toLowerCase().replaceAll(' ', '-'),
          vapidPublicKey: 'a',
          vapidPrivateKey: 'b',
          visibility: 'public',
          OrganizationId: organization.id,
        }),
      ),
    );

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
    await Promise.all(
      collections
        .flatMap((collection) =>
          apps
            .filter((app) => app.definition.name?.includes(collection.name))
            .map((app) => [collection, app] as [AppCollection, App]),
        )
        .map(([collection, app]) =>
          AppCollectionApp.create({ AppCollectionId: collection.id, AppId: app.id }),
        ),
    );
  });

  it('should unpin an app from an app collection', async () => {
    const app1 = (await AppCollectionApp.findByPk(apps[0].id))!;
    await app1.update({ pinnedAt: new Date() });

    authorizeStudio(user);
    const response = await request.delete(
      `/api/app-collections/${collections[0].id}/apps/${apps[0].id}/pinned`,
    );
    expect(response.status).toBe(204);

    const app2 = (await AppCollectionApp.findByPk(apps[0].id))!;
    expect(app2.pinnedAt).toBeNull();
  });

  it('should not allow a user to unpin an app to an app collection they do not own', async () => {
    const unprivilegedUser = await createTestUser('nobody@example.com');
    authorizeStudio(unprivilegedUser);

    const response2 = await request.delete(
      `/api/app-collections/${collections[0].id}/apps/${apps[0].id}/pinned`,
    );
    expect(response2).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not a member of this organization.",
        "statusCode": 403,
      }
    `);
  });
});

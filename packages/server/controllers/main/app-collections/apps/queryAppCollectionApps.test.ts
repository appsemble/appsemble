import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppCollection,
  AppCollectionApp,
  AppMessages,
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

describe('queryAppCollectionApps', () => {
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

  it('should return the apps in an app collection', async () => {
    const response = await request.get(`/api/app-collections/${collections[0].id}/apps`);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual([
      expect.objectContaining({
        id: apps[0].id,
        path: 'productivity-and-collaboration-app',
      }),
      expect.objectContaining({
        id: apps[2].id,
        path: 'productivity-app',
      }),
    ]);
  });

  it('should return localized apps in an app collection', async () => {
    await AppMessages.create({
      AppId: apps[0].id,
      language: 'nl',
      messages: { app: { name: 'test in dutch' }, messageIds: { test: 'test translation' } },
    });
    await AppMessages.create({
      AppId: apps[2].id,
      language: 'en',
      messages: { messageIds: { test2: 'test translation 2' } },
    });
    const response = await request.get(
      `/api/app-collections/${collections[0].id}/apps?language=nl`,
    );
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject([
      expect.objectContaining({
        id: apps[0].id,
        path: 'productivity-and-collaboration-app',
        messages: {
          app: expect.objectContaining({ name: 'test in dutch' }),
          messageIds: { test: 'test translation' },
        },
      }),
      expect.objectContaining({
        id: apps[2].id,
        path: 'productivity-app',
        messages: expect.objectContaining({
          app: expect.objectContaining({
            name: 'Productivity App',
          }),
        }),
      }),
    ]);

    const responseEnglish = await request.get(
      `/api/app-collections/${collections[0].id}/apps?language=en`,
    );
    expect(responseEnglish.status).toBe(200);
    expect(responseEnglish.data).toMatchObject([
      expect.objectContaining({
        id: apps[0].id,
        path: 'productivity-and-collaboration-app',
        messages: {
          app: expect.objectContaining({ name: 'Productivity and Collaboration App' }),
          messageIds: {},
        },
      }),
      expect.objectContaining({
        id: apps[2].id,
        path: 'productivity-app',
        messages: {
          app: expect.objectContaining({
            name: 'Productivity App',
          }),
          messageIds: { test2: 'test translation 2' },
        },
      }),
    ]);
  });

  it('should not show apps in a private app collection unless the user has permission to view the collection', async () => {
    const privateCollection = await AppCollection.create({
      name: 'Private Collection',
      expertName: 'Expert van den Expert',
      expertProfileImage: Buffer.from(''),
      headerImage: Buffer.from(''),
      expertProfileImageMimeType: 'image/png',
      headerImageMimeType: 'image/png',
      expertDescription: 'I’m an expert, trust me.',
      OrganizationId: organization.id,
      visibility: 'private',
    });

    await AppCollectionApp.create({
      AppCollectionId: privateCollection.id,
      AppId: apps[0].id,
    });

    const response = await request.get(`/api/app-collections/${privateCollection.id}/apps`);
    expect(response.status).toBe(403);

    authorizeStudio(user);

    const response2 = await request.get(`/api/app-collections/${privateCollection.id}/apps`);
    expect(response2.status).toBe(200);
    expect(response2.data).toContainEqual(
      expect.objectContaining({
        id: apps[0].id,
      }),
    );
  });

  it('should not show private/unlisted apps unless the user has permission to view them', async () => {
    const [privateApp, unlistedApp] = await Promise.all(
      ['private', 'unlisted'].map((visibility) =>
        App.create({
          definition: {
            name: `${visibility} App`,
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
          path: `${visibility}-app`,
          vapidPublicKey: 'a',
          vapidPrivateKey: 'b',
          OrganizationId: organization.id,
          visibility,
        }),
      ),
    );
    await AppCollectionApp.create({
      AppCollectionId: collections[0].id,
      AppId: privateApp.id,
    });
    await AppCollectionApp.create({
      AppCollectionId: collections[0].id,
      AppId: unlistedApp.id,
    });

    const response = await request.get(`/api/app-collections/${collections[0].id}/apps`);
    expect(response.status).toBe(200);
    expect(response.data).not.toContainEqual(
      expect.objectContaining({
        id: unlistedApp.id,
      }),
    );
    expect(response.data).not.toContainEqual(
      expect.objectContaining({
        id: privateApp.id,
      }),
    );

    authorizeStudio(user);
    const response2 = await request.get(`/api/app-collections/${collections[0].id}/apps`);
    expect(response2.status).toBe(200);
    expect(response2.data).toContainEqual(
      expect.objectContaining({
        id: unlistedApp.id,
      }),
    );
    expect(response2.data).toContainEqual(
      expect.objectContaining({
        id: privateApp.id,
      }),
    );
  });

  it('should include the pin status of an app in the app collection apps endpoint', async () => {
    const response = await request.get(`/api/app-collections/${collections[0].id}/apps`);
    expect(response.status).toBe(200);
    expect(response.data).toContainEqual(
      expect.objectContaining({
        id: apps[0].id,
        pinnedAt: null,
      }),
    );

    await AppCollectionApp.update(
      {
        pinnedAt: new Date(),
      },
      {
        where: {
          AppCollectionId: collections[0].id,
          AppId: apps[0].id,
        },
      },
    );

    const response2 = await request.get(`/api/app-collections/${collections[0].id}/apps`);
    expect(response2.status).toBe(200);
    expect(response2.data).toContainEqual(
      expect.objectContaining({
        id: apps[0].id,
        pinnedAt: '1970-01-01T00:00:00.000Z',
      }),
    );
  });

  it('should show pinned apps first in the app collection apps endpoint', async () => {
    const funAndProductivityApp = await App.create({
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

    await AppCollectionApp.create({
      AppCollectionId: collections[0].id,
      AppId: funAndProductivityApp.id,
      pinnedAt: new Date(),
    });

    vi.useRealTimers();
    vi.useFakeTimers();
    vi.advanceTimersByTime(60 * 1000);

    await AppCollectionApp.update(
      {
        pinnedAt: new Date(),
      },
      {
        where: {
          AppCollectionId: collections[0].id,
          AppId: apps[0].id,
        },
      },
    );

    authorizeStudio(user);

    const response = await request.get(`/api/app-collections/${collections[0].id}/apps`);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual([
      expect.objectContaining({
        id: apps[0].id,
        path: 'productivity-and-collaboration-app',
      }),
      expect.objectContaining({
        id: funAndProductivityApp.id,
        path: 'fun-and-productivity-app',
      }),
      expect.objectContaining({
        id: apps[2].id,
        path: 'productivity-app',
      }),
    ]);
  });
});

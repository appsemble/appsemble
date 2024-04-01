import { createFixtureStream, createFormData, readFixture } from '@appsemble/node-utils';
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
} from '../models/index.js';
import { type Argv, setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let organization: Organization;
let otherOrganization: Organization;
let apps: App[];
let funAndProductivityApp: App;
let collections: AppCollection[] = [];
let privateCollection: AppCollection;
let user: User;
let unprivilegedUser: User;
const argv: Partial<Argv> = { host: 'http://localhost', secret: 'test', aesSecret: 'test' };

useTestDatabase(import.meta);

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
  unprivilegedUser = await createTestUser('nobody@example.com');
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  otherOrganization = await Organization.create({
    id: 'otherOrganization',
    name: 'Other Organization',
  });
  await OrganizationMember.create({
    OrganizationId: organization.id,
    UserId: user.id,
    role: 'Owner',
  });
  await OrganizationMember.create({
    OrganizationId: otherOrganization.id,
    UserId: unprivilegedUser.id,
    role: 'Owner',
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
  privateCollection = await AppCollection.create({
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

describe('appCollections', () => {
  it('should query a list of app collections', async () => {
    const response = await request.get('/api/appCollections');
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual(
      expect.arrayContaining([
        {
          id: collections[0].id,
          name: 'Productivity',
          $expert: {
            name: 'Expert van den Expert',
            description: 'I’m an expert, trust me.',
            profileImage: `/api/appCollections/${collections[0].id}/expert/profileImage`,
          },
          headerImage: `/api/appCollections/${collections[0].id}/headerImage`,
          OrganizationId: organization.id,
          OrganizationName: organization.name,
          visibility: 'public',
          domain: null,
          $created: new Date(0).toISOString(),
          $updated: new Date(0).toISOString(),
        },
        {
          id: collections[1].id,
          name: 'Fun',
          $expert: {
            name: 'Expert van den Expert',
            description: 'I’m an expert, trust me.',
            profileImage: `/api/appCollections/${collections[1].id}/expert/profileImage`,
          },
          headerImage: `/api/appCollections/${collections[1].id}/headerImage`,
          OrganizationId: organization.id,
          OrganizationName: organization.name,
          visibility: 'public',
          domain: null,
          $created: new Date(0).toISOString(),
          $updated: new Date(0).toISOString(),
        },
        {
          id: collections[2].id,
          name: 'Collaboration',
          $expert: {
            name: 'Expert van den Expert',
            description: 'I’m an expert, trust me.',
            profileImage: `/api/appCollections/${collections[2].id}/expert/profileImage`,
          },
          headerImage: `/api/appCollections/${collections[2].id}/headerImage`,
          OrganizationId: organization.id,
          OrganizationName: organization.name,
          visibility: 'public',
          domain: null,
          $created: new Date(0).toISOString(),
          $updated: new Date(0).toISOString(),
        },
      ]),
    );
  });

  it('should query a list of app collections for an organization', async () => {
    const otherCollection = await AppCollection.create({
      name: 'Other Collection',
      expertName: 'Expert van den Expert',
      expertProfileImage: Buffer.from(''),
      expertProfileImageMimeType: 'image/png',
      headerImage: Buffer.from(''),
      headerImageMimeType: 'image/png',
      expertDescription: 'I’m an expert, trust me.',
      OrganizationId: otherOrganization.id,
      visibility: 'public',
    });

    const response = await request.get(`/api/organizations/${organization.id}/appCollections`);
    expect(response.status).toBe(200);
    for (const { id } of collections) {
      expect(response.data).toContainEqual(
        expect.objectContaining({
          id,
        }),
      );
    }
    expect(response.data).not.toContainEqual(
      expect.objectContaining({
        id: otherCollection.id,
      }),
    );
  });

  it('should get a single app collection', async () => {
    const response = await request.get(`/api/appCollections/${collections[0].id}`);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({
      id: collections[0].id,
      name: 'Productivity',
      $expert: {
        name: 'Expert van den Expert',
        description: 'I’m an expert, trust me.',
        profileImage: `/api/appCollections/${collections[0].id}/expert/profileImage`,
      },
      headerImage: `/api/appCollections/${collections[0].id}/headerImage`,
      OrganizationId: organization.id,
      visibility: 'public',
      domain: null,
      $created: new Date(0).toISOString(),
      $updated: new Date(0).toISOString(),
    });
  });

  it('should not show a private app collection unless the user has permission to view it', async () => {
    const response = await request.get(`/api/appCollections/${privateCollection.id}`);
    expect(response.status).toBe(404);

    authorizeStudio(user);

    const response2 = await request.get(`/api/appCollections/${privateCollection.id}`);
    expect(response2.status).toBe(200);
  });

  it('should create a new app collection', async () => {
    authorizeStudio(user);
    const response = await request.post(
      `/api/organizations/${organization.id}/appCollections`,
      createFormData({
        name: 'Test Collection',
        visibility: 'public',
        expertName: 'Expert van den Expert',
        expertDescription: 'I’m an expert, trust me.',
        expertProfileImage: createFixtureStream('tux.png'),
        headerImage: createFixtureStream('standing.png'),
      }),
    );
    expect(response.status).toBe(201);
    expect(response.data).toStrictEqual({
      id: expect.any(Number),
      name: 'Test Collection',
      $expert: {
        name: 'Expert van den Expert',
        description: 'I’m an expert, trust me.',
        profileImage: `/api/appCollections/${response.data.id}/expert/profileImage`,
      },
      headerImage: `/api/appCollections/${response.data.id}/headerImage`,
      OrganizationId: organization.id,
      OrganizationName: organization.name,
      visibility: 'public',
      domain: null,
      $created: new Date(0).toISOString(),
      $updated: new Date(0).toISOString(),
    });

    const collection = await AppCollection.findByPk(response.data.id);
    expect(collection).not.toBeNull();
  });

  it('should delete an app collection', async () => {
    authorizeStudio(user);
    const response = await request.delete(`/api/appCollections/${collections[0].id}`);
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const collection = await AppCollection.findByPk(collections[0].id);
    expect(collection).toBeNull();
  });

  it('should not allow a user to create a collection without permission', async () => {
    const response = await request.post(
      `/api/organizations/${organization.id}/appCollections`,
      createFormData({
        name: 'Test Collection',
        visibility: 'public',
        expertName: 'Expert van den Expert',
        expertDescription: 'I’m an expert, trust me.',
        expertProfileImage: createFixtureStream('tux.png'),
        headerImage: createFixtureStream('standing.png'),
      }),
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: text/plain; charset=utf-8

      Unauthorized
    `);

    authorizeStudio(unprivilegedUser);

    const response2 = await request.post(
      `/api/organizations/${organization.id}/appCollections`,
      createFormData({
        name: 'Test Collection',
        visibility: 'public',
        expertName: 'Expert van den Expert',
        expertDescription: 'I’m an expert, trust me.',
        expertProfileImage: createFixtureStream('tux.png'),
        headerImage: createFixtureStream('standing.png'),
      }),
    );
    expect(response2).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not part of this organization.",
        "statusCode": 403,
      }
    `);
  });

  it('should not allow a user to delete a collection without permission', async () => {
    const response = await request.delete(`/api/appCollections/${collections[0].id}`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: text/plain; charset=utf-8

      Unauthorized
    `);

    authorizeStudio(unprivilegedUser);

    const response2 = await request.delete(`/api/appCollections/${collections[0].id}`);
    expect(response2).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not part of this organization.",
        "statusCode": 403,
      }
    `);
  });

  it('should not show private app collections unless the user has permission to view them', async () => {
    const response = await request.get('/api/appCollections');
    expect(response.status).toBe(200);
    expect(response.data).not.toContainEqual(
      expect.objectContaining({
        id: privateCollection.id,
      }),
    );

    const response2 = await request.get(`/api/organizations/${organization.id}/appCollections`);
    expect(response2.status).toBe(200);
    expect(response2.data).not.toContainEqual(
      expect.objectContaining({
        id: privateCollection.id,
      }),
    );

    authorizeStudio(user);

    const response3 = await request.get('/api/appCollections');
    expect(response3.status).toBe(200);
    expect(response3.data).toContainEqual(
      expect.objectContaining({
        id: privateCollection.id,
      }),
    );

    const response4 = await request.get(`/api/organizations/${organization.id}/appCollections`);
    expect(response4.status).toBe(200);
    expect(response4.data).toContainEqual(
      expect.objectContaining({
        id: privateCollection.id,
      }),
    );
  });

  it('should return app collection header image', async () => {
    const response = await request.get(`/api/appCollections/${collections[0].id}/headerImage`, {
      responseType: 'arraybuffer',
    });
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toStrictEqual(await readFixture('standing.png'));
  });

  it('should return app collection expert profile image', async () => {
    const response = await request.get(
      `/api/appCollections/${collections[0].id}/expert/profileImage`,
      {
        responseType: 'arraybuffer',
      },
    );
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toStrictEqual(await readFixture('tux.png'));
  });

  it('should update an app collection', async () => {
    authorizeStudio(user);
    const response = await request.patch(
      `/api/appCollections/${collections[0].id}`,
      createFormData({
        name: 'New Name',
        visibility: 'private',
        expertName: 'New Expert Name',
        expertDescription: 'New Expert Description',
        expertProfileImage: createFixtureStream('standing.png'),
        headerImage: createFixtureStream('tux.png'),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({
      id: collections[0].id,
      name: 'New Name',
      $expert: {
        name: 'New Expert Name',
        description: 'New Expert Description',
        profileImage: `/api/appCollections/${collections[0].id}/expert/profileImage`,
      },
      headerImage: `/api/appCollections/${collections[0].id}/headerImage`,
      OrganizationId: organization.id,
      OrganizationName: organization.name,
      visibility: 'private',
      domain: null,
      $created: new Date(0).toISOString(),
      $updated: new Date(0).toISOString(),
    });

    const collection = await AppCollection.findByPk(collections[0].id);
    expect(collection).not.toBeNull();
    expect(collection?.name).toBe('New Name');
    expect(collection?.visibility).toBe('private');
    expect(collection?.expertName).toBe('New Expert Name');
    expect(collection?.expertDescription).toBe('New Expert Description');
    expect(collection?.expertProfileImageMimeType).toBe('image/png');
    expect(collection?.headerImageMimeType).toBe('image/png');

    const response2 = await request.get(response.data.$expert.profileImage, {
      responseType: 'arraybuffer',
    });
    expect(response2.status).toBe(200);
    expect(response2.headers['content-type']).toBe('image/png');
    expect(response2.data).toStrictEqual(await readFixture('standing.png'));

    const response3 = await request.get(response.data.headerImage, {
      responseType: 'arraybuffer',
    });
    expect(response3.status).toBe(200);
    expect(response3.headers['content-type']).toBe('image/png');
    expect(response3.data).toStrictEqual(await readFixture('tux.png'));

    const response4 = await request.patch(
      `/api/appCollections/${collections[0].id}`,
      createFormData({
        name: 'New Name 2',
      }),
    );
    expect(response4.status).toBe(200);
    expect(response4.data).toStrictEqual({
      ...response.data,
      name: 'New Name 2',
    });
  });

  it('should not allow a user to update a collection without permission', async () => {
    const response = await request.patch(
      `/api/appCollections/${collections[0].id}`,
      createFormData({
        name: 'New Name',
        visibility: 'private',
        expertName: 'New Expert Name',
        expertDescription: 'New Expert Description',
        expertProfileImage: createFixtureStream('standing.png'),
        headerImage: createFixtureStream('tux.png'),
      }),
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: text/plain; charset=utf-8

      Unauthorized
    `);

    authorizeStudio(unprivilegedUser);

    const response2 = await request.patch(
      `/api/appCollections/${collections[0].id}`,
      createFormData({
        name: 'New Name',
        visibility: 'private',
        expertName: 'New Expert Name',
        expertDescription: 'New Expert Description',
        expertProfileImage: createFixtureStream('standing.png'),
        headerImage: createFixtureStream('tux.png'),
      }),
    );
    expect(response2).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not part of this organization.",
        "statusCode": 403,
      }
    `);
  });
});

describe('appCollectionApps', () => {
  it('should add an app to an app collection', async () => {
    authorizeStudio(user);
    const response = await request.post(`/api/appCollections/${collections[0].id}/apps`, {
      AppId: funAndProductivityApp.id,
    });
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const collection = await AppCollection.findByPk(collections[0].id, {
      include: [{ model: AppCollectionApp, include: [{ model: App }] }],
    });
    expect(collection).not.toBeNull();
    expect(collection?.Apps.map((app) => app.App.path)).toStrictEqual(
      expect.arrayContaining([
        'productivity-and-collaboration-app',
        'productivity-app',
        'fun-and-productivity-app',
      ]),
    );
  });

  it('should return the apps in an app collection', async () => {
    const response = await request.get(`/api/appCollections/${collections[0].id}/apps`);
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
    const response = await request.get(`/api/appCollections/${collections[0].id}/apps?language=nl`);
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
      `/api/appCollections/${collections[0].id}/apps?language=en`,
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

  it('should remove an app from an app collection', async () => {
    authorizeStudio(user);
    const response = await request.delete(
      `/api/appCollections/${collections[0].id}/apps/${apps[0].id}`,
    );
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const collection = await AppCollection.findByPk(collections[0].id, {
      include: [{ model: AppCollectionApp, include: [{ model: App }] }],
    });

    expect(collection).not.toBeNull();
    expect(collection?.Apps.map((app) => app.App.path)).toStrictEqual(['productivity-app']);
  });

  it('should not show private apps in an app collection unless the user has permission to view them', async () => {
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

    const response = await request.get(`/api/appCollections/${collections[0].id}/apps`);
    expect(response.status).toBe(200);
    expect(response.data).not.toContainEqual(
      expect.objectContaining({
        id: privateApp.id,
      }),
    );
    expect(response.data).not.toContainEqual(
      expect.objectContaining({
        id: unlistedApp.id,
      }),
    );

    authorizeStudio(user);

    const response2 = await request.get(`/api/appCollections/${collections[0].id}/apps`);
    expect(response2.status).toBe(200);
    expect(response2.data).toContainEqual(
      expect.objectContaining({
        id: privateApp.id,
      }),
    );
  });

  it('should not show apps in a private app collection unless the user has permission to view the collection', async () => {
    await AppCollectionApp.create({
      AppCollectionId: privateCollection.id,
      AppId: apps[0].id,
    });

    const response = await request.get(`/api/appCollections/${privateCollection.id}/apps`);
    expect(response.status).toBe(404);

    authorizeStudio(user);

    const response2 = await request.get(`/api/appCollections/${privateCollection.id}/apps`);
    expect(response2.status).toBe(200);
    expect(response2.data).toContainEqual(
      expect.objectContaining({
        id: apps[0].id,
      }),
    );
  });

  // XXX: This test hangs, but functionality works fine on the server
  // eslint-disable-next-line vitest/no-disabled-tests
  it.skip('should not allow duplicate apps in an app collection', async () => {
    authorizeStudio(user);

    const response = await request.post(`/api/appCollections/${collections[0].id}/apps`, {
      AppId: funAndProductivityApp.id,
    });
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const response2 = await request.post(`/api/appCollections/${collections[0].id}/apps`, {
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

  it('should not allow a user to add an app to an app collection without permission', async () => {
    authorizeStudio(unprivilegedUser);
    const response = await request.post(`/api/appCollections/${collections[0].id}/apps`, {
      AppId: funAndProductivityApp.id,
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not part of this organization.",
        "statusCode": 403,
      }
    `);
  });

  it('should not allow a user to remove an app from an app collection without permission', async () => {
    authorizeStudio(unprivilegedUser);
    const response = await request.delete(
      `/api/appCollections/${collections[0].id}/apps/${apps[0].id}`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not part of this organization.",
        "statusCode": 403,
      }
    `);
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

    const response = await request.get(`/api/appCollections/${collections[0].id}/apps`);
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
    const response2 = await request.get(`/api/appCollections/${collections[0].id}/apps`);
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

  describe('pinned apps', () => {
    it('should pin an app to an app collection', async () => {
      const app1 = await AppCollectionApp.findByPk(apps[0].id);
      expect(app1.pinnedAt).toBeNull();
      authorizeStudio(user);
      const response = await request.post(
        `/api/appCollections/${collections[0].id}/apps/${apps[0].id}/pinned`,
      );
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual({
        pinnedAt: '1970-01-01T00:00:00.000Z',
      });

      const app2 = await AppCollectionApp.findByPk(apps[0].id);
      expect(app2.pinnedAt).not.toBeNull();
    });

    it('should unpin an app from an app collection', async () => {
      const app1 = await AppCollectionApp.findByPk(apps[0].id);
      await app1.update({ pinnedAt: new Date() });

      authorizeStudio(user);
      const response = await request.delete(
        `/api/appCollections/${collections[0].id}/apps/${apps[0].id}/pinned`,
      );
      expect(response.status).toBe(204);

      const app2 = await AppCollectionApp.findByPk(apps[0].id);
      expect(app2.pinnedAt).toBeNull();
    });

    it('should include the pin status of an app in the app collection apps endpoint', async () => {
      const response = await request.get(`/api/appCollections/${collections[0].id}/apps`);
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

      const response2 = await request.get(`/api/appCollections/${collections[0].id}/apps`);
      expect(response2.status).toBe(200);
      expect(response2.data).toContainEqual(
        expect.objectContaining({
          id: apps[0].id,
          pinnedAt: '1970-01-01T00:00:00.000Z',
        }),
      );
    });

    it('should not allow a user to pin or unpin an app to an app collection they do not own', async () => {
      authorizeStudio(unprivilegedUser);
      const response = await request.post(
        `/api/appCollections/${collections[0].id}/apps/${apps[0].id}/pinned`,
      );
      expect(response.status).toBe(403);

      const response2 = await request.delete(
        `/api/appCollections/${collections[0].id}/apps/${apps[0].id}/pinned`,
      );
      expect(response2.status).toBe(403);
    });

    it('should show pinned apps first in the app collection apps endpoint', async () => {
      await AppCollectionApp.create({
        AppCollectionId: collections[0].id,
        AppId: funAndProductivityApp.id,
        pinnedAt: new Date(),
      });

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

      const response = await request.get(`/api/appCollections/${collections[0].id}/apps`);
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
});

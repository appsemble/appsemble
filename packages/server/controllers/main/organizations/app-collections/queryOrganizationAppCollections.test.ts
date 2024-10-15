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
const argv: Partial<Argv> = { host: 'http://localhost', secret: 'test', aesSecret: 'test' };

describe('queryOrganizationAppCollections', () => {
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
  });

  it('should query a list of app collections for an organization', async () => {
    const apps = await Promise.all(
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
    const collections = await Promise.all(
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

    const otherOrganization = await Organization.create({
      id: 'otherOrganization',
      name: 'Other Organization',
    });

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

    const response = await request.get(`/api/organizations/${organization.id}/app-collections`);
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

  it('should not show private app collections unless the user has permission to view them', async () => {
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
    const response = await request.get(`/api/organizations/${organization.id}/app-collections`);
    expect(response.status).toBe(200);
    expect(response.data).not.toContainEqual(
      expect.objectContaining({
        id: privateCollection.id,
      }),
    );
    authorizeStudio(user);

    const response3 = await request.get(`/api/organizations/${organization.id}/app-collections`);
    expect(response3.status).toBe(200);
    expect(response3.data).toContainEqual(
      expect.objectContaining({
        id: privateCollection.id,
      }),
    );
  });
});

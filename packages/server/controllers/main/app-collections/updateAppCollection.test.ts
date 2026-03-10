import { createFixtureStream, createFormData, readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AppCollection,
  Organization,
  OrganizationMember,
  type User,
} from '../../../models/index.js';
import { type Argv, setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let user: User;
const argv: Partial<Argv> = { host: 'http://localhost', secret: 'test', aesSecret: 'test' };

describe('updateAppCollection', () => {
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
  });

  it('should update an app collection', async () => {
    const tuxPng = await readFixture('tux.png');
    const standingPng = await readFixture('standing.png');
    const collection = await AppCollection.create({
      name: 'Productivity',
      expertName: 'Expert van den Expert',
      expertProfileImage: tuxPng,
      expertProfileImageMimeType: 'image/png',
      headerImage: standingPng,
      headerImageMimeType: 'image/png',
      expertDescription: 'I’m an expert, trust me.',
      OrganizationId: organization.id,
      visibility: 'public',
    });

    authorizeStudio(user);
    const response = await request.patch(
      `/api/app-collections/${collection.id}`,
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
      id: collection.id,
      name: 'New Name',
      $expert: {
        name: 'New Expert Name',
        description: 'New Expert Description',
        profileImage: `/api/app-collections/${collection.id}/expert/profile-image`,
      },
      headerImage: `/api/app-collections/${collection.id}/header-image`,
      OrganizationId: organization.id,
      OrganizationName: organization.name,
      visibility: 'private',
      domain: null,
      $created: new Date(0).toISOString(),
      $updated: new Date(0).toISOString(),
    });

    await collection.reload();
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
      `/api/app-collections/${collection.id}`,
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
    const collection = await AppCollection.create({
      name: 'Productivity',
      expertName: 'Expert van den Expert',
      expertProfileImage: Buffer.from('expertProfileImage'),
      expertProfileImageMimeType: 'image/png',
      headerImage: Buffer.from('headerImage'),
      headerImageMimeType: 'image/png',
      expertDescription: 'I’m an expert, trust me.',
      OrganizationId: organization.id,
      visibility: 'public',
    });

    const response = await request.patch(
      `/api/app-collections/${collection.id}`,
      createFormData({
        name: 'New Name',
      }),
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: text/plain; charset=utf-8

      Unauthorized
    `);

    const unprivilegedUser = await createTestUser('nobody@example.com');
    authorizeStudio(unprivilegedUser);

    const response2 = await request.patch(
      `/api/app-collections/${collection.id}`,
      createFormData({
        name: 'New Name',
      }),
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

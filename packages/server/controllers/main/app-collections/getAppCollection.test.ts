import { readFixture } from '@appsemble/node-utils';
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

describe('getAppCollection', () => {
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

  it('should get a single app collection', async () => {
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

    const response = await request.get(`/api/app-collections/${collections[0].id}`);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({
      id: collections[0].id,
      name: 'Productivity',
      $expert: {
        name: 'Expert van den Expert',
        description: 'I’m an expert, trust me.',
        profileImage: `/api/app-collections/${collections[0].id}/expert/profile-image`,
      },
      headerImage: `/api/app-collections/${collections[0].id}/header-image`,
      OrganizationId: organization.id,
      visibility: 'public',
      domain: null,
      $created: new Date(0).toISOString(),
      $updated: new Date(0).toISOString(),
    });
  });

  it('should not show a private app collection unless the user has permission to view it', async () => {
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

    const response = await request.get(`/api/app-collections/${privateCollection.id}`);
    expect(response.status).toBe(403);

    authorizeStudio(user);

    const response2 = await request.get(`/api/app-collections/${privateCollection.id}`);
    expect(response2.status).toBe(200);
    expect(response2.data).toMatchObject({
      id: 1,
      name: 'Private Collection',
      OrganizationId: organization.id,
      visibility: 'private',
      $expert: {
        name: 'Expert van den Expert',
        description: 'I’m an expert, trust me.',
        profileImage: '/api/app-collections/1/expert/profile-image',
      },
      headerImage: '/api/app-collections/1/header-image',
      domain: null,
      $created: '1970-01-01T00:00:00.000Z',
      $updated: '1970-01-01T00:00:00.000Z',
    });
  });
});

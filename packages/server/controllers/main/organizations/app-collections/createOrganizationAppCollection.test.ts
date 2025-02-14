import { createFixtureStream, createFormData } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  AppCollection,
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

describe('createOrganizationAppCollection', () => {
  beforeAll(async () => {
    setArgv(argv);
    const server = await createServer({});
    await setTestApp(server);
  });

  beforeEach(async () => {
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

  it('should create a new app collection', async () => {
    authorizeStudio(user);
    const response = await request.post(
      `/api/organizations/${organization.id}/app-collections`,
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
        profileImage: `/api/app-collections/${response.data.id}/expert/profile-image`,
      },
      headerImage: `/api/app-collections/${response.data.id}/header-image`,
      OrganizationId: organization.id,
      OrganizationName: organization.name,
      visibility: 'public',
      domain: null,
      $created: expect.any(String),
      $updated: expect.any(String),
    });

    const collection = await AppCollection.findByPk(response.data.id);
    expect(collection).not.toBeNull();
  });

  it('should not allow a user to create a collection without permission', async () => {
    const response = await request.post(
      `/api/organizations/${organization.id}/app-collections`,
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

    const unprivilegedUser = await createTestUser('nobody@example.com');
    authorizeStudio(unprivilegedUser);

    const response2 = await request.post(
      `/api/organizations/${organization.id}/app-collections`,
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
        "message": "User is not a member of this organization.",
        "statusCode": 403,
      }
    `);
  });
});

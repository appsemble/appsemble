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
let collection: AppCollection;
const argv: Partial<Argv> = { host: 'http://localhost', secret: 'test', aesSecret: 'test' };

describe('deleteAppCollection', () => {
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
    collection = await AppCollection.create({
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
  });

  it('should delete an app collection', async () => {
    authorizeStudio(user);
    const response = await request.delete(`/api/app-collections/${collection.id}`);
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const nullCollection = await AppCollection.findByPk(collection.id);
    expect(nullCollection).toBeNull();
  });

  it('should not allow a user to delete a collection without permission', async () => {
    const response = await request.delete(`/api/app-collections/${collection.id}`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: text/plain; charset=utf-8

      Unauthorized
    `);

    const unprivilegedUser = await createTestUser('nobody@example.com');
    authorizeStudio(unprivilegedUser);

    const response2 = await request.delete(`/api/app-collections/${collection.id}`);
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

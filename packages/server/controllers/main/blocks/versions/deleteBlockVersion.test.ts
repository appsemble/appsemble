import { request, setTestApp } from 'axios-test-instance';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeClientCredentials,
  createTestUser,
} from '../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

useTestDatabase(import.meta);

let user: User;

beforeEach(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  user = await createTestUser();
  const organization = await Organization.create({
    id: 'xkcd',
    name: 'xkcd',
  });
  await OrganizationMember.create({
    OrganizationId: organization.id,
    UserId: user.id,
    role: 'Maintainer',
  });
  await setTestApp(server);
});

describe('deleteBlockVersion', () => {
  it('should delete a block version if user has sufficient permissions.', async () => {
    await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test-delete',
      version: '1.2.3',
    });

    await authorizeClientCredentials('blocks:delete');
    const { status } = await request.delete('/api/blocks/@xkcd/test-delete/versions/1.2.3');
    expect(status).toBe(204);
    const response = await request.get('/api/blocks/@xkcd/test-delete/versions/1.2.3');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Block version not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not delete a block version, user does not have sufficient permission.', async () => {
    await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await authorizeClientCredentials('blocks:delete');
    await OrganizationMember.update(
      { role: 'Member' },
      { where: { OrganizationId: 'xkcd', UserId: user.id } },
    );

    const response = await request.delete('/api/blocks/@xkcd/test/versions/1.2.3');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient organization permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should not delete a block version that is used by apps.', async () => {
    await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await App.create(
      {
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [{ name: 'Test', blocks: [{ type: '@xkcd/test', version: '1.2.3' }] }],
        },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: 'xkcd',
      },
      { raw: true },
    );

    await authorizeClientCredentials('blocks:delete');
    const response = await request.delete('/api/blocks/@xkcd/test/versions/1.2.3');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "Cannot delete blocks that are used by apps.",
        "statusCode": 403,
      }
    `);
  });
});

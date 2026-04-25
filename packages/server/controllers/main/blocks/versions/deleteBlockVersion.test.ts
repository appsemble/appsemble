import { getS3FileBuffer, uploadS3File } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  BlockAsset,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { getBlockAssetsBucketName } from '../../../../utils/blockAssets.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeClientCredentials,
  createTestUser,
} from '../../../../utils/test/authorization.js';

let user: User;

describe('deleteBlockVersion', () => {
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

  it('should delete S3-backed block assets with the block version', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test-delete',
      version: '1.2.3',
    });
    const content = Buffer.from('asset');
    const storageKey = 'blocks/xkcd/test-delete/1.2.3/hello.js';

    await uploadS3File(getBlockAssetsBucketName(), storageKey, content, content.byteLength);
    await BlockAsset.create({
      BlockVersionId: block.id,
      filename: 'hello.js',
      mime: 'application/javascript',
      size: content.byteLength,
      storageKey,
    });

    await authorizeClientCredentials('blocks:delete');
    const { status } = await request.delete('/api/blocks/@xkcd/test-delete/versions/1.2.3');

    expect(status).toBe(204);
    expect(await getS3FileBuffer(getBlockAssetsBucketName(), storageKey)).toBeNull();
  });

  it('should not delete S3-backed block assets that are still referenced', async () => {
    const [deletedBlock, retainedBlock] = await Promise.all([
      BlockVersion.create({
        OrganizationId: 'xkcd',
        name: 'test-delete',
        version: '1.2.3',
      }),
      BlockVersion.create({
        OrganizationId: 'xkcd',
        name: 'test-retain',
        version: '1.2.3',
      }),
    ]);
    const content = Buffer.from('shared asset');
    const storageKey = 'blocks/xkcd/shared/1.2.3/hash/hello.js';

    await uploadS3File(getBlockAssetsBucketName(), storageKey, content, content.byteLength);
    await BlockAsset.bulkCreate([
      {
        BlockVersionId: deletedBlock.id,
        filename: 'hello.js',
        mime: 'application/javascript',
        size: content.byteLength,
        storageKey,
      },
      {
        BlockVersionId: retainedBlock.id,
        filename: 'hello.js',
        mime: 'application/javascript',
        size: content.byteLength,
        storageKey,
      },
    ]);

    await authorizeClientCredentials('blocks:delete');
    const { status } = await request.delete('/api/blocks/@xkcd/test-delete/versions/1.2.3');

    expect(status).toBe(204);
    expect(await BlockAsset.count({ where: { storageKey } })).toBe(1);
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

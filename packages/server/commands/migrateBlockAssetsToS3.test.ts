import { getS3FileBuffer } from '@appsemble/node-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { migrateBlockAssetsToS3 } from './migrateBlockAssetsToS3.js';
import { BlockAsset, BlockVersion, Organization } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import {
  getBlockAssetContentHash,
  getBlockAssetsBucketName,
  getBlockAssetStorageKey,
} from '../utils/blockAssets.js';

async function createBlockVersion(): Promise<BlockVersion> {
  await Organization.create({
    id: 'xkcd',
    name: 'xkcd',
  });

  return BlockVersion.create({
    OrganizationId: 'xkcd',
    name: 'test',
    version: '1.2.3',
  });
}

describe('migrateBlockAssetsToS3', () => {
  beforeEach(() => {
    setArgv({ host: 'http://localhost', secret: 'test' });
  });

  it('should upload database-backed block assets to S3 and clear database content', async () => {
    const blockVersion = await createBlockVersion();
    const content = Buffer.from('console.log("Hello from Postgres!")');
    const blockAsset = await BlockAsset.create({
      BlockVersionId: blockVersion.id,
      content,
      filename: 'hello.js',
      mime: 'application/javascript',
    });
    const storageKey = getBlockAssetStorageKey({
      blockName: blockVersion.name,
      contentHash: getBlockAssetContentHash(content),
      filename: 'hello.js',
      organizationId: blockVersion.OrganizationId,
      version: blockVersion.version,
    });

    expect(await migrateBlockAssetsToS3({ batch: 10 })).toStrictEqual({
      failed: 0,
      scanned: 1,
      skipped: 0,
      uploaded: 1,
    });

    await blockAsset.reload();
    expect(blockAsset).toMatchObject({
      content: null,
      size: content.byteLength,
      storageKey,
    });
    expect(await getS3FileBuffer(getBlockAssetsBucketName(), storageKey)).toStrictEqual(content);
  });

  it('should ignore block assets that have already been migrated', async () => {
    const blockVersion = await createBlockVersion();
    await BlockAsset.create({
      BlockVersionId: blockVersion.id,
      filename: 'hello.js',
      mime: 'application/javascript',
      size: 1,
      storageKey: 'xkcd/test/1.2.3/hash/hello.js',
    });

    expect(await migrateBlockAssetsToS3({ batch: 10 })).toStrictEqual({
      failed: 0,
      scanned: 0,
      skipped: 0,
      uploaded: 0,
    });
  });

  it('should leave content retryable when uploading to S3 fails', async () => {
    const uploadS3FileSpy = vi
      .spyOn(await import('@appsemble/node-utils'), 'uploadS3File')
      .mockRejectedValueOnce(new Error('S3 unavailable'));
    const blockVersion = await createBlockVersion();
    const content = Buffer.from('console.log("Hello from Postgres!")');
    const blockAsset = await BlockAsset.create({
      BlockVersionId: blockVersion.id,
      content,
      filename: 'hello.js',
      mime: 'application/javascript',
    });

    expect(await migrateBlockAssetsToS3({ batch: 10 })).toStrictEqual({
      failed: 1,
      scanned: 1,
      skipped: 0,
      uploaded: 0,
    });

    await blockAsset.reload();
    expect(blockAsset).toMatchObject({
      content,
      size: null,
      storageKey: null,
    });

    uploadS3FileSpy.mockRestore();
  });
});

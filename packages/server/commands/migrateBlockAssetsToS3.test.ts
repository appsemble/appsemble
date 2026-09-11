import { getS3FileBuffer } from '@appsemble/node-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { migrateBlockAssetsToS3 } from './migrateBlockAssetsToS3.js';
import { BlockAsset, BlockVersion, Organization } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { getBlockAssetsBucketName, getBlockAssetStorageKey } from '../utils/blockAssets.js';

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

  it('should reject a non-positive batch size', async () => {
    await expect(migrateBlockAssetsToS3({ batch: 0 })).rejects.toThrow(
      'The block asset migration batch size must be a positive integer.',
    );
  });

  it('should upload database-backed block assets to S3 and preserve rollback content', async () => {
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
      blockVersionId: blockVersion.id,
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
      content,
      size: content.byteLength,
      storageKey,
    });
    expect(await getS3FileBuffer(getBlockAssetsBucketName(), storageKey)).toStrictEqual(content);
  });

  it('should ignore block assets that have already been migrated', async () => {
    const blockVersion = await createBlockVersion();
    await BlockAsset.create({
      BlockVersionId: blockVersion.id,
      content: Buffer.from('x'),
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

  it('should retry and succeed on a later run when an S3 upload fails once', async () => {
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
    const storageKey = getBlockAssetStorageKey({
      blockName: blockVersion.name,
      blockVersionId: blockVersion.id,
      filename: 'hello.js',
      organizationId: blockVersion.OrganizationId,
      version: blockVersion.version,
    });

    // The upload fails, so the row must be left untouched and remain retryable.
    expect(await migrateBlockAssetsToS3({ batch: 10 })).toStrictEqual({
      failed: 1,
      scanned: 1,
      skipped: 0,
      uploaded: 0,
    });
    await blockAsset.reload();
    expect(blockAsset).toMatchObject({ content, size: null, storageKey: null });

    // A later run (with S3 available again) picks the same row up and completes the migration.
    expect(await migrateBlockAssetsToS3({ batch: 10 })).toStrictEqual({
      failed: 0,
      scanned: 1,
      skipped: 0,
      uploaded: 1,
    });
    await blockAsset.reload();
    expect(blockAsset).toMatchObject({ content, size: content.byteLength, storageKey });
    expect(await getS3FileBuffer(getBlockAssetsBucketName(), storageKey)).toStrictEqual(content);

    uploadS3FileSpy.mockRestore();
  });

  it('should migrate every asset across multiple batches', async () => {
    const blockVersion = await createBlockVersion();
    const contents = [0, 1, 2].map((index) => Buffer.from(`console.log(${index})`));
    await BlockAsset.bulkCreate(
      contents.map((content, index) => ({
        BlockVersionId: blockVersion.id,
        content,
        filename: `file-${index}.js`,
        mime: 'application/javascript',
      })),
    );

    expect(await migrateBlockAssetsToS3({ batch: 2 })).toStrictEqual({
      failed: 0,
      scanned: 3,
      skipped: 0,
      uploaded: 3,
    });

    const migratedAssets = await BlockAsset.findAll({ order: [['filename', 'ASC']] });
    expect(migratedAssets.map(({ content }) => content)).toStrictEqual(contents);
    expect(await BlockAsset.count({ where: { storageKey: null } })).toBe(0);
  });

  it('should preserve fallback content and resume after a partial batch failure', async () => {
    const nodeUtils = await import('@appsemble/node-utils');
    const { uploadS3File } = nodeUtils;
    let uploadCount = 0;
    const uploadS3FileSpy = vi.spyOn(nodeUtils, 'uploadS3File').mockImplementation((...args) => {
      uploadCount += 1;
      return uploadCount === 2
        ? Promise.reject(new Error('S3 unavailable'))
        : uploadS3File(...args);
    });
    const blockVersion = await createBlockVersion();
    const contents = [0, 1, 2].map((index) => Buffer.from(`console.log(${index})`));
    await BlockAsset.bulkCreate(
      contents.map((content, index) => ({
        BlockVersionId: blockVersion.id,
        content,
        filename: `partial-${index}.js`,
        mime: 'application/javascript',
      })),
    );

    expect(await migrateBlockAssetsToS3({ batch: 3 })).toStrictEqual({
      failed: 1,
      scanned: 3,
      skipped: 0,
      uploaded: 2,
    });
    const partiallyMigrated = await BlockAsset.findAll({ order: [['filename', 'ASC']] });
    expect(partiallyMigrated.map(({ content }) => content)).toStrictEqual(contents);
    expect(partiallyMigrated.filter(({ storageKey }) => storageKey)).toHaveLength(2);

    uploadS3FileSpy.mockRestore();
    expect(await migrateBlockAssetsToS3({ batch: 3 })).toStrictEqual({
      failed: 0,
      scanned: 1,
      skipped: 0,
      uploaded: 1,
    });
    expect(await BlockAsset.count({ where: { storageKey: null } })).toBe(0);
  });
});

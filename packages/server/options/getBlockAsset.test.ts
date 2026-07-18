import { Readable } from 'node:stream';

import { getS3File, getS3FileStats } from '@appsemble/node-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getBlockAsset } from './getBlockAsset.js';
import { BlockAsset, BlockVersion } from '../models/index.js';
import { getBlockAssetsBucketName } from '../utils/blockAssets.js';

vi.mock('@appsemble/node-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@appsemble/node-utils')>();

  return {
    ...actual,
    getS3File: vi.fn(),
    getS3FileStats: vi.fn(),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getBlockAsset', () => {
  it('should stream an S3-backed block asset from its storage key', async () => {
    const stream = Readable.from(['console.log(1)']);
    const lastModified = new Date('2026-01-01T00:00:00.000Z');
    const storageKey = 'appsemble/form/1.0.0/hash/form.js.map';

    vi.spyOn(BlockVersion, 'findOne').mockResolvedValueOnce({ id: 'version-id' } as never);
    vi.spyOn(BlockAsset, 'findOne').mockResolvedValueOnce({
      content: null,
      filename: 'form.js.map',
      mime: 'application/javascript',
      storageKey,
    } as never);
    vi.mocked(getS3File).mockResolvedValueOnce(stream);
    vi.mocked(getS3FileStats).mockResolvedValueOnce({
      etag: '"etag"',
      lastModified,
      size: 14,
    } as never);

    const result = await getBlockAsset({
      context: {} as never,
      filename: 'form.js.map',
      name: '@appsemble/form',
      version: '1.0.0',
    });

    // The asset must be fetched from the key stored on the row, not a hardcoded or derived one.
    expect(getS3File).toHaveBeenCalledWith(getBlockAssetsBucketName(), storageKey);
    expect(result).toStrictEqual({
      etag: '"etag"',
      filename: 'form.js.map',
      lastModified,
      mime: 'application/javascript',
      size: 14,
      stream,
    });
  });

  it('should fall back to database content when the asset is not S3-backed', async () => {
    const content = Buffer.from('console.log(1)');

    vi.spyOn(BlockVersion, 'findOne').mockResolvedValueOnce({ id: 'version-id' } as never);
    vi.spyOn(BlockAsset, 'findOne').mockResolvedValueOnce({
      content,
      filename: 'form.js.map',
      mime: 'application/javascript',
      storageKey: null,
    } as never);

    const result = await getBlockAsset({
      context: {} as never,
      filename: 'form.js.map',
      name: '@appsemble/form',
      version: '1.0.0',
    });

    expect(getS3File).not.toHaveBeenCalled();
    expect(result).toStrictEqual({
      content,
      filename: 'form.js.map',
      mime: 'application/javascript',
    });
  });

  it('should return null when the asset has neither an S3 object nor content', async () => {
    vi.spyOn(BlockVersion, 'findOne').mockResolvedValueOnce({ id: 'version-id' } as never);
    vi.spyOn(BlockAsset, 'findOne').mockResolvedValueOnce({
      content: null,
      filename: 'form.js.map',
      mime: 'application/javascript',
      storageKey: null,
    } as never);

    const result = await getBlockAsset({
      context: {} as never,
      filename: 'form.js.map',
      name: '@appsemble/form',
      version: '1.0.0',
    });

    expect(result).toBeNull();
  });

  it('should return null if the block version does not exist', async () => {
    const findVersion = vi.spyOn(BlockVersion, 'findOne').mockResolvedValueOnce(null);
    const findAsset = vi.spyOn(BlockAsset, 'findOne').mockResolvedValueOnce({} as never);

    const result = await getBlockAsset({
      context: {} as never,
      filename: 'form.js.map',
      name: '@appsemble/form',
      version: '1.0.0',
    });

    expect(findVersion).toHaveBeenCalledTimes(1);
    expect(findAsset).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});

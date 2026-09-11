import { buffer as streamToBuffer } from 'node:stream/consumers';

import { uploadS3File } from '@appsemble/node-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import { getBlockAsset } from './getBlockAsset.js';
import { BlockAsset, BlockVersion, Organization } from '../models/index.js';
import { getBlockAssetsBucketName } from '../utils/blockAssets.js';

describe('getBlockAsset', () => {
  let blockVersion: BlockVersion;

  beforeEach(async () => {
    await Organization.create({ id: 'appsemble', name: 'Appsemble' });
    blockVersion = await BlockVersion.create({
      OrganizationId: 'appsemble',
      name: 'form',
      version: '1.0.0',
    });
  });

  it('should return bytes and metadata from an S3-backed block asset', async () => {
    const content = Buffer.from('console.log("object storage")');
    const storageKey = `appsemble/form/1.0.0/${blockVersion.id}/form.js.map`;
    await uploadS3File(getBlockAssetsBucketName(), storageKey, content, content.byteLength, {
      'Content-Type': 'application/javascript',
    });
    await BlockAsset.create({
      BlockVersionId: blockVersion.id,
      content: Buffer.from('database fallback'),
      filename: 'form.js.map',
      mime: 'application/javascript',
      storageKey,
    });

    const result = await getBlockAsset({
      context: {} as never,
      filename: 'form.js.map',
      name: '@appsemble/form',
      version: '1.0.0',
    });

    expect(result).toMatchObject({
      filename: 'form.js.map',
      mime: 'application/javascript',
      size: content.byteLength,
    });
    expect(result.etag).toBeTruthy();
    expect(result.lastModified).toBeInstanceOf(Date);
    expect(await streamToBuffer(result.stream!)).toStrictEqual(content);
  });

  it('should fall back to database content when the asset is not S3-backed', async () => {
    const content = Buffer.from('console.log(1)');
    await BlockAsset.create({
      BlockVersionId: blockVersion.id,
      content,
      filename: 'form.js.map',
      mime: 'application/javascript',
    });

    const result = await getBlockAsset({
      context: {} as never,
      filename: 'form.js.map',
      name: '@appsemble/form',
      version: '1.0.0',
    });

    expect(result).toStrictEqual({
      content,
      filename: 'form.js.map',
      mime: 'application/javascript',
    });
  });

  it('should return null if the block version does not exist', async () => {
    const result = await getBlockAsset({
      context: {} as never,
      filename: 'form.js.map',
      name: '@unknown/form',
      version: '9.9.9',
    });

    expect(result).toBeNull();
  });
});

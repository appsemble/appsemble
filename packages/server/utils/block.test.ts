import { getS3FileBuffer, uploadS3File } from '@appsemble/node-utils';
import { type BlockManifest } from '@appsemble/types';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { setArgv } from './argv.js';
import { syncBlock } from './block.js';
import {
  ensureBlockAssetsBucketPublicRead,
  getBlockAssetContentHash,
  getBlockAssetsBucketName,
  getBlockAssetStorageKey,
} from './blockAssets.js';
import { BlockAsset, Organization } from '../models/index.js';

const organizationId = 'test';
const blockName = 'example';
const blockVersion = '1.2.3';
const filename = 'example.js';
const content = Buffer.from('console.log("Hello from a synchronized block!")');
const s3Host = process.env.S3_HOST || 'localhost';
const s3Port = Number(process.env.S3_PORT) || 9009;
const blockAssetsBaseUrl = `http://${s3Host}:${s3Port}`;
const remote = 'https://appsemble.example';
const blockUrl = `${remote}/api/blocks/@${organizationId}/${blockName}/versions/${blockVersion}`;
const legacyAssetUrl = `${blockUrl}/asset?filename=${filename}`;

let mock: MockAdapter;

function createManifest(fileUrls?: Record<string, string>): BlockManifest {
  return {
    name: `@${organizationId}/${blockName}`,
    version: blockVersion,
    files: [filename],
    fileUrls,
    languages: null,
  };
}

async function expectSynchronizedAsset(): Promise<void> {
  const blockAsset = await BlockAsset.findOne({ where: { filename } });
  expect(blockAsset).toMatchObject({
    content: null,
    filename,
    mime: 'application/javascript',
    size: content.byteLength,
  });

  const storageKey = getBlockAssetStorageKey({
    blockName,
    contentHash: getBlockAssetContentHash(content),
    filename,
    organizationId,
    version: blockVersion,
  });
  expect(blockAsset?.storageKey).toBe(storageKey);
  expect(await getS3FileBuffer(getBlockAssetsBucketName(), storageKey)).toStrictEqual(content);
}

describe('syncBlock', () => {
  beforeEach(async () => {
    setArgv({
      blockAssetsBaseUrl,
      host: 'http://localhost',
      remote,
      secret: 'test',
    });
    mock = new MockAdapter(axios, { onNoMatch: 'passthrough' });
    await Organization.create({ id: organizationId, name: 'Test' });
  });

  afterEach(() => {
    mock.restore();
  });

  it('should synchronize block assets directly from their public file URLs', async () => {
    const sourceStorageKey = `source/${filename}`;
    await ensureBlockAssetsBucketPublicRead();
    await uploadS3File(getBlockAssetsBucketName(), sourceStorageKey, content, content.byteLength, {
      'Content-Type': 'application/javascript',
    });
    const fileUrl = `${blockAssetsBaseUrl}/${getBlockAssetsBucketName()}/${sourceStorageKey}`;
    mock.onGet(blockUrl).reply(200, createManifest({ [filename]: fileUrl }));

    await syncBlock({ OrganizationId: organizationId, name: blockName, version: blockVersion });

    expect(mock.history.get.map(({ url }) => url)).toStrictEqual([blockUrl, fileUrl]);
    await expectSynchronizedAsset();
  });

  it('should fall back to the remote block asset endpoint when file URLs are unavailable', async () => {
    mock.onGet(blockUrl).reply(200, createManifest());
    mock.onGet(legacyAssetUrl).reply(200, content, {
      'content-type': 'application/javascript',
    });

    await syncBlock({ OrganizationId: organizationId, name: blockName, version: blockVersion });

    expect(mock.history.get.map(({ url }) => url)).toStrictEqual([blockUrl, legacyAssetUrl]);
    await expectSynchronizedAsset();
  });
});

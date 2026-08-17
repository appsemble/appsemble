import { createServer } from 'node:http';
import { type AddressInfo } from 'node:net';

import { getS3FileBuffer, uploadS3File } from '@appsemble/node-utils';
import { type BlockManifest } from '@appsemble/types';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { setArgv } from './argv.js';
import { syncBlock } from './block.js';
import { ensureBlockAssetsBucketPublicRead, getBlockAssetsBucketName } from './blockAssets.js';
import { BlockAsset, BlockVersion, Organization } from '../models/index.js';

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
const allowPrivateIPAddress = process.env.VITEST_CONF_ALLOW_PRIVATE_IP_PROXY;

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
    content,
    filename,
    mime: 'application/javascript',
    size: content.byteLength,
  });

  expect(blockAsset?.storageKey).toContain(`/${blockAsset!.BlockVersionId}/`);
  expect(await getS3FileBuffer(getBlockAssetsBucketName(), blockAsset!.storageKey!)).toStrictEqual(
    content,
  );
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
    if (allowPrivateIPAddress == null) {
      delete process.env.VITEST_CONF_ALLOW_PRIVATE_IP_PROXY;
    } else {
      process.env.VITEST_CONF_ALLOW_PRIVATE_IP_PROXY = allowPrivateIPAddress;
    }
  });

  it('should synchronize block assets directly from their public file URLs', async () => {
    expect.hasAssertions();
    const sourceStorageKey = `source/${filename}`;
    await ensureBlockAssetsBucketPublicRead();
    await uploadS3File(getBlockAssetsBucketName(), sourceStorageKey, content, content.byteLength, {
      'Content-Type': 'application/javascript',
    });
    const fileUrl = `${blockAssetsBaseUrl}/${getBlockAssetsBucketName()}/${sourceStorageKey}`;
    mock.onGet(blockUrl).reply(200, createManifest({ [filename]: fileUrl }));
    mock.onGet(legacyAssetUrl).reply(200, Buffer.from('legacy endpoint content'), {
      'content-type': 'application/javascript',
    });

    await syncBlock({ OrganizationId: organizationId, name: blockName, version: blockVersion });

    await expectSynchronizedAsset();
  });

  it('should fall back to the remote block asset endpoint when file URLs are unavailable', async () => {
    expect.hasAssertions();
    mock.onGet(blockUrl).reply(200, createManifest());
    mock.onGet(legacyAssetUrl).reply(200, content, {
      'content-type': 'application/javascript',
    });

    await syncBlock({ OrganizationId: organizationId, name: blockName, version: blockVersion });

    await expectSynchronizedAsset();
  });

  it('should reject private file URLs without persisting a partial block', async () => {
    process.env.VITEST_CONF_ALLOW_PRIVATE_IP_PROXY = '0';
    const privateServer = createServer((request, response) => {
      request.resume();
      response.end(content);
    });
    await new Promise<void>((resolve) => {
      privateServer.listen(0, '127.0.0.1', resolve);
    });

    try {
      const { port } = privateServer.address() as AddressInfo;
      mock
        .onGet(blockUrl)
        .reply(200, createManifest({ [filename]: `http://127.0.0.1:${port}/private.js` }));

      await expect(
        syncBlock({ OrganizationId: organizationId, name: blockName, version: blockVersion }),
      ).rejects.toThrow(/not allowed|private/i);
      expect(await BlockVersion.count()).toBe(0);
      expect(await BlockAsset.count()).toBe(0);
    } finally {
      await new Promise<void>((resolve, reject) => {
        privateServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});

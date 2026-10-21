import { createServer } from 'node:http';
import { type AddressInfo } from 'node:net';

import { getBlockAssetLocation, getS3FileBuffer, uploadS3File } from '@appsemble/node-utils';
import { type BlockManifest } from '@appsemble/types';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { setArgv } from './argv.js';
import { syncBlock, syncOrganizationBlocks } from './block.js';
import { ensureBlockAssetsBucketPublicRead } from './blockAssets.js';
import { BlockAsset, BlockVersion, Organization, User } from '../models/index.js';

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
  const { bucket, key } = getBlockAssetLocation(blockAsset!.storageKey!);
  expect(await getS3FileBuffer(bucket, key)).toStrictEqual(content);
}

describe('syncBlock', () => {
  beforeEach(async () => {
    setArgv({
      blockAssetsBaseUrl,
      host: 'http://localhost',
      remote,
      secret: 'test',
    });
    mock = new MockAdapter(axios as ConstructorParameters<typeof MockAdapter>[0], {
      onNoMatch: 'passthrough',
    });
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

  // The bucket-per-app layout makes the block assets bucket public. The single-bucket layout keeps
  // the bucket private, so its file URLs are only reachable through the server.
  it.skipIf(process.env.S3_BUCKET)(
    'should synchronize block assets directly from their public file URLs',
    async () => {
      expect.hasAssertions();
      const sourceStorageKey = `source/${filename}`;
      await ensureBlockAssetsBucketPublicRead();
      const { bucket, key } = getBlockAssetLocation(sourceStorageKey);
      await uploadS3File(bucket, key, content, content.byteLength, {
        'Content-Type': 'application/javascript',
      });
      const fileUrl = `${blockAssetsBaseUrl}/${bucket}/${key}`;
      mock.onGet(blockUrl).reply(200, createManifest({ [filename]: fileUrl }));
      mock.onGet(legacyAssetUrl).reply(200, Buffer.from('legacy endpoint content'), {
        'content-type': 'application/javascript',
      });

      await syncBlock({ OrganizationId: organizationId, name: blockName, version: blockVersion });

      await expectSynchronizedAsset();
    },
  );

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

describe('syncOrganizationBlocks', () => {
  const organizationBlocksUrl = `${remote}/api/organizations/${organizationId}/blocks`;

  function mockRemoteBlock(version: string): void {
    mock
      .onGet(`${remote}/api/blocks/@${organizationId}/${blockName}/versions/${version}`)
      .reply(200, { name: `@${organizationId}/${blockName}`, version, files: [], languages: null });
  }

  async function getLocalVersions(): Promise<string[]> {
    const blockVersions = await BlockVersion.findAll({
      attributes: ['version'],
      order: [['version', 'ASC']],
      where: { OrganizationId: organizationId, name: blockName },
    });
    return blockVersions.map(({ version }) => version);
  }

  beforeEach(async () => {
    setArgv({ host: 'http://localhost', remote, secret: 'test' });
    mock = new MockAdapter(axios as ConstructorParameters<typeof MockAdapter>[0]);
    await Organization.create({ id: organizationId, name: 'Test' });
  });

  afterEach(() => {
    mock.restore();
  });

  it.each`
    description                                                  | local                        | remoteVersion     | expected
    ${'a block that does not exist locally'}                     | ${[]}                        | ${'1.0.0'}        | ${['1.0.0']}
    ${'a newer version of a block'}                              | ${['1.0.0']}                 | ${'1.1.0'}        | ${['1.0.0', '1.1.0']}
    ${'a release of a local prerelease'}                         | ${['1.0.0-test.1']}          | ${'1.0.0'}        | ${['1.0.0', '1.0.0-test.1']}
    ${'nothing if the block is up to date'}                      | ${['1.1.0']}                 | ${'1.1.0'}        | ${['1.1.0']}
    ${'nothing if the remote version is older'}                  | ${['1.1.0']}                 | ${'1.0.0'}        | ${['1.1.0']}
    ${'nothing if the remote has a prerelease'}                  | ${['1.0.0']}                 | ${'1.0.0-test.1'} | ${['1.0.0']}
    ${'nothing if the newest local version sorts first as text'} | ${['9.0.0', '10.0.0']}       | ${'10.0.0'}       | ${['10.0.0', '9.0.0']}
    ${'nothing if a local prerelease of it sorts last as text'}  | ${['1.0.0', '1.0.0-test.1']} | ${'1.0.0'}        | ${['1.0.0', '1.0.0-test.1']}
  `(
    'should synchronize $description',
    async ({
      expected,
      local,
      remoteVersion,
    }: {
      expected: string[];
      local: string[];
      remoteVersion: string;
    }) => {
      for (const version of local) {
        await BlockVersion.create({ OrganizationId: organizationId, name: blockName, version });
      }
      mock
        .onGet(organizationBlocksUrl)
        .reply(200, [{ name: `@${organizationId}/${blockName}`, version: remoteVersion }]);
      mockRemoteBlock(remoteVersion);

      await syncOrganizationBlocks(organizationId);

      expect(await getLocalVersions()).toStrictEqual(expected);
    },
  );

  it('should skip a block whose version is not found on the remote', async () => {
    mock
      .onGet(organizationBlocksUrl)
      .reply(200, [{ name: `@${organizationId}/${blockName}`, version: '1.0.0' }]);
    mock.onGet(`${remote}/api/blocks/@${organizationId}/${blockName}/versions/1.0.0`).reply(404);

    await syncOrganizationBlocks(organizationId);

    expect(await getLocalVersions()).toStrictEqual([]);
  });

  it('should create a missing organization from the remote', async () => {
    const id = 'remote-only';
    mock.onGet(`${remote}/api/organizations/${id}`).reply(200, {
      id,
      name: 'Remote Only',
      description: 'From the remote',
      website: 'https://remote-only.example',
    });
    mock
      .onGet(`${remote}/api/organizations/${id}/blocks`)
      .reply(200, [{ name: `@${id}/${blockName}`, version: '1.0.0' }]);
    mock
      .onGet(`${remote}/api/blocks/@${id}/${blockName}/versions/1.0.0`)
      .reply(200, { name: `@${id}/${blockName}`, version: '1.0.0', files: [], languages: null });

    await syncOrganizationBlocks(id);

    const organization = await Organization.findByPk(id, { include: [User] });
    expect(organization).toMatchObject({
      name: 'Remote Only',
      description: 'From the remote',
      website: 'https://remote-only.example',
      Users: [],
    });
    expect(await BlockVersion.count({ where: { OrganizationId: id } })).toBe(1);
  });

  it('should synchronize blocks of a soft-deleted organization without recreating it', async () => {
    await Organization.destroy({ where: { id: organizationId } });
    mock
      .onGet(organizationBlocksUrl)
      .reply(200, [{ name: `@${organizationId}/${blockName}`, version: '1.0.0' }]);
    mockRemoteBlock('1.0.0');

    await syncOrganizationBlocks(organizationId);

    expect(await getLocalVersions()).toStrictEqual(['1.0.0']);
    expect(await Organization.findByPk(organizationId)).toBeNull();
  });

  it('should fail if the organization does not exist on the remote', async () => {
    mock.onGet(organizationBlocksUrl).reply(404);

    await expect(syncOrganizationBlocks(organizationId)).rejects.toThrow(/404/);
  });
});

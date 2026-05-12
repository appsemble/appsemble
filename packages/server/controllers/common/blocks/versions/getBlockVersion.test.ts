import { createFixtureStream, readFixture } from '@appsemble/node-utils';
import { type BlockManifest } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BlockAsset,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { getBlockAssetContentHash } from '../../../../utils/blockAssets.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeClientCredentials,
  createTestUser,
} from '../../../../utils/test/authorization.js';

let user: User;

describe('getBlockVersion', () => {
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

  it('should be possible to retrieve a block version', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });

    await authorizeClientCredentials('blocks:write');
    const { data: created } = await request.post<BlockManifest>('/api/blocks', formData);

    const {
      data: retrieved,
      headers,
      status,
    } = await request.get<BlockManifest>('/api/blocks/@xkcd/standing/versions/1.32.9');

    expect(retrieved.iconUrl).toBeNull();
    expect(retrieved).toStrictEqual(created);
    expect(status).toBe(200);
    expect(headers['cache-control']).toBe('public,max-age=31536000,immutable');
  });

  it('should lazily backfill manifestJson when missing', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });

    await authorizeClientCredentials('blocks:write');
    await request.post<BlockManifest>('/api/blocks', formData);

    await BlockVersion.update(
      { manifestJson: null },
      { where: { name: 'standing', OrganizationId: 'xkcd', version: '1.32.9' } },
    );

    const { status } = await request.get<BlockManifest>(
      '/api/blocks/@xkcd/standing/versions/1.32.9',
    );

    const persisted = await BlockVersion.findOne({
      attributes: ['manifestJson'],
      where: { name: 'standing', OrganizationId: 'xkcd', version: '1.32.9' },
    });

    expect(status).toBe(200);
    expect(persisted?.manifestJson).toBeTruthy();
  });

  it('should add public file URLs to cached manifestJson without rebuilding it', async () => {
    setArgv({
      blockAssetsBaseUrl: 'https://static.appsemble.example',
      host: 'http://localhost',
      secret: 'test',
    });
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });

    await authorizeClientCredentials('blocks:write');
    await request.post<BlockManifest>('/api/blocks', formData);

    const findByPkSpy = vi.spyOn(BlockVersion, 'findByPk');
    const { data, status } = await request.get<BlockManifest>(
      '/api/blocks/@xkcd/standing/versions/1.32.9',
    );

    const content = await readFixture('standing.png');
    const contentHash = getBlockAssetContentHash(content);

    expect(status).toBe(200);
    expect(findByPkSpy).not.toHaveBeenCalled();
    expect(data).toMatchObject({
      files: ['standing.png'],
      fileUrls: {
        'standing.png': `https://static.appsemble.example/appsemble-block-assets/xkcd/standing/1.32.9/${contentHash}/standing.png`,
      },
    });

    const blockAssetCount = await BlockAsset.count();
    expect(blockAssetCount).toBe(1);
  });

  it('should use the block’s icon in the iconUrl if the block has one', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });
    formData.append('icon', createFixtureStream('nodejs-logo.png'), { filepath: 'icon.png' });

    await authorizeClientCredentials('blocks:write');
    const { data: created } = await request.post('/api/blocks', formData);
    const { data: retrieved, status } = await request.get<BlockManifest>(
      '/api/blocks/@xkcd/standing/versions/1.32.9',
    );

    expect(retrieved).toStrictEqual(created);
    expect(retrieved.iconUrl).toBe('/api/blocks/@xkcd/standing/versions/1.32.9/icon');
    expect(status).toBe(200);
  });

  it('should use the organization icon in the iconUrl if the block does not have one', async () => {
    vi.clearAllTimers();
    vi.setSystemTime(0);
    await Organization.update(
      { icon: await readFixture('nodejs-logo.png') },
      { where: { id: 'xkcd' } },
    );
    vi.useRealTimers();
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });

    await authorizeClientCredentials('blocks:write');
    const { data: created } = await request.post('/api/blocks', formData);

    const { data: retrieved, status } = await request.get<BlockManifest>(
      '/api/blocks/@xkcd/standing/versions/1.32.9',
    );

    expect(retrieved).toStrictEqual(created);
    expect(retrieved.iconUrl).toBe(
      '/api/organizations/xkcd/icon?updated=1970-01-01T00%3A00%3A00.000Z',
    );
    expect(status).toBe(200);
  });

  it('should respond with 404 when trying to fetch a non existing block version', async () => {
    const { data, status } = await request.get('/api/blocks/@xkcd/standing/versions/3.1.4');
    expect(status).toBe(404);
    expect(data).toStrictEqual({
      error: 'Not Found',
      message: 'Block version not found',
      statusCode: 404,
    });
  });
});

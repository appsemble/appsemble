import { beforeEach, describe, expect, it } from 'vitest';

import { setArgv } from './argv.js';
import {
  getBlockAssetFileUrls,
  getSettingsBlockFileUrls,
  getBlockAssetStorageKey,
} from './blockAssets.js';
import { BlockAsset, BlockVersion, Organization } from '../models/index.js';

beforeEach(() => {
  setArgv({
    blockAssetsBaseUrl: 'https://static.appsemble.example',
    host: 'http://localhost',
    secret: 'test',
  });
});

describe('getBlockAssetStorageKey', () => {
  it('should keep every asset for a block version in one immutable directory', () => {
    expect(
      getBlockAssetStorageKey({
        blockName: 'test',
        blockVersionId: 'd1907cbb-67a8-4a33-96fa-adeb03f288a9',
        filename: 'build/standing.png',
        organizationId: 'xkcd',
        version: '1.2.3',
      }),
    ).toBe('xkcd/test/1.2.3/d1907cbb-67a8-4a33-96fa-adeb03f288a9/build/standing.png');
  });
});

describe('getBlockAssetFileUrls', () => {
  it('should not expose a partially migrated block version', () => {
    expect(
      getBlockAssetFileUrls([
        { filename: 'test.js', storageKey: 'xkcd/test/1.2.3/id/test.js' },
        { filename: 'chunk.js', storageKey: null },
      ]),
    ).toStrictEqual({});
  });

  it('should expose every asset after the block version is fully migrated', () => {
    expect(
      getBlockAssetFileUrls([
        { filename: 'test.js', storageKey: 'xkcd/test/1.2.3/id/test.js' },
        { filename: 'chunk.js', storageKey: 'xkcd/test/1.2.3/id/chunk.js' },
      ]),
    ).toStrictEqual({
      'chunk.js':
        'https://static.appsemble.example/appsemble-block-assets/xkcd/test/1.2.3/id/chunk.js',
      'test.js':
        'https://static.appsemble.example/appsemble-block-assets/xkcd/test/1.2.3/id/test.js',
    });
  });
});

describe('getSettingsBlockFileUrls', () => {
  it('should resolve exact block name and version pairs', async () => {
    await Organization.create({ id: 'xkcd', name: 'xkcd' });
    const [a1, a2, b2] = await BlockVersion.bulkCreate([
      { OrganizationId: 'xkcd', name: 'a', version: '1.0.0' },
      { OrganizationId: 'xkcd', name: 'a', version: '2.0.0' },
      { OrganizationId: 'xkcd', name: 'b', version: '2.0.0' },
    ]);
    await BlockAsset.bulkCreate(
      [a1, a2, b2].map((blockVersion) => ({
        BlockVersionId: blockVersion.id,
        content: Buffer.from(blockVersion.name),
        filename: `${blockVersion.name}.js`,
        storageKey: `xkcd/${blockVersion.name}/${blockVersion.version}/${blockVersion.id}/${blockVersion.name}.js`,
      })),
    );

    const result = await getSettingsBlockFileUrls([
      { name: '@xkcd/a', version: '1.0.0' },
      { name: '@xkcd/b', version: '2.0.0' },
    ]);

    expect(Object.keys(result)).toStrictEqual(['@xkcd/a@1.0.0', '@xkcd/b@2.0.0']);
  });
});

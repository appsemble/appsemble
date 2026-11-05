import {
  createFixtureStream,
  getAppAssetLocation,
  getS3FileBuffer,
  logger,
  readFixture,
  uploadS3File,
} from '@appsemble/node-utils';
import { describe, expect, it, vi } from 'vitest';

import { cleanupResourcesAndAssets } from './cleanupResourcesAndAssets.js';
import { App, getAppDB, Organization } from '../models/index.js';

vi.mock('@appsemble/node-utils', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    logger: {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    },
    deleteS3Files: vi.fn(() => Promise.resolve()),
  };
});

vi.mock('../models/index.js', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    getAppDB: vi.fn(actual.getAppDB),
  };
});

describe('cleanupResourcesAndAssets', () => {
  const appDB = {
    Asset: {
      create: vi.fn(),
      destroy: vi.fn(),
      findAll: vi.fn(),
    },
    Resource: {
      destroy: vi.fn(),
      findAll: vi.fn(),
    },
    sequelize: {
      close: vi.fn(),
    },
  };

  it('skips an app whose getAppDB fails and still cleans up the other apps', async () => {
    // The command queries demo apps first, then regular apps.
    vi.spyOn(App, 'findAll').mockImplementation((options: any) =>
      Promise.resolve(options?.where?.demoMode ? [] : ([{ id: 1 }, { id: 2 }, { id: 3 }] as any)),
    );
    vi.mocked(getAppDB).mockImplementation((appId: number) =>
      appId === 2
        ? Promise.reject(new Error('Unsupported state or unable to authenticate data'))
        : Promise.resolve(appDB as any),
    );

    appDB.Asset.findAll.mockResolvedValue([]);
    appDB.Asset.destroy.mockResolvedValue(0);
    appDB.Resource.findAll.mockResolvedValue([]);
    appDB.Resource.destroy.mockResolvedValue(0);
    appDB.sequelize.close.mockImplementation(() => Promise.resolve());

    expect(await cleanupResourcesAndAssets()).toBeUndefined();

    expect(getAppDB).toHaveBeenCalledTimes(3);
    expect(logger.warn).toHaveBeenCalledWith(
      'Failed to connect to database for app 2, skipping cleanup.',
    );
    // Apps 1 and 3 are processed; app 2 is skipped before opening a connection.
    expect(appDB.Asset.destroy).toHaveBeenCalledTimes(2);
    expect(appDB.Resource.destroy).toHaveBeenCalledTimes(2);
    expect(appDB.sequelize.close).toHaveBeenCalledTimes(2);
  });

  it('reseeds the seed assets of a demo app as ephemeral copies', async () => {
    await Organization.create({ id: 'testorganization', name: 'Test Organization' });
    const { id: appId } = await App.create({
      demoMode: true,
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
    });
    const { Asset } = await getAppDB(appId);
    const { id: seedAssetId } = await Asset.create({ name: 'tasks', seed: true, sha256: 'hash' });
    const seed = getAppAssetLocation(appId, seedAssetId);
    await uploadS3File(seed.bucket, seed.key, createFixtureStream('standing.png'));

    await cleanupResourcesAndAssets();

    // The command closes the app database, so open it again to read the result.
    const { Asset: ReopenedAsset } = await getAppDB(appId, undefined, undefined, true);
    const copy = await ReopenedAsset.findOne({ where: { ephemeral: true } });
    expect(copy).toMatchObject({ name: 'tasks', seed: false, sha256: 'hash' });
    const target = getAppAssetLocation(appId, copy!.id);
    expect(await getS3FileBuffer(target.bucket, target.key)).toStrictEqual(
      await readFixture('standing.png'),
    );
  });
});

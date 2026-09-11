import { logger } from '@appsemble/node-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanupResourcesAndAssets } from './cleanupResourcesAndAssets.js';
import { App, getAppDB } from '../models/index.js';

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

vi.mock('../models/index.js', () => ({
  App: {
    findAll: vi.fn(),
  },
  getAppDB: vi.fn(),
  initDB: vi.fn(),
}));

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

  beforeEach(() => {
    // The command queries demo apps first, then regular apps.
    vi.mocked(App.findAll).mockImplementation((options: any) =>
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
  });

  it('skips an app whose getAppDB fails and still cleans up the other apps', async () => {
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
});

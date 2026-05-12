import { logger } from '@appsemble/node-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanupDemoAppMembers } from './cleanupDemoAppMembers.js';
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
  };
});

vi.mock('../models/index.js', () => ({
  App: {
    findAll: vi.fn(),
  },
  getAppDB: vi.fn(),
  initDB: vi.fn(),
}));

describe('cleanupDemoAppMembers', () => {
  const appDB = {
    AppMember: {
      destroy: vi.fn(),
      findAll: vi.fn(),
    },
    GroupMember: {
      destroy: vi.fn(),
    },
    Resource: {
      destroy: vi.fn(),
    },
    sequelize: {
      close: vi.fn(),
      transaction: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.mocked(App.findAll).mockResolvedValue([{ id: 1 }, { id: 2 }] as any);
    vi.mocked(getAppDB).mockImplementation((appId: number) =>
      appId === 1
        ? Promise.reject(new Error('DB connection failed'))
        : Promise.resolve(appDB as any),
    );

    appDB.AppMember.findAll.mockResolvedValue([{ id: 10 }, { id: 11 }]);
    appDB.AppMember.destroy.mockResolvedValue(2);
    appDB.GroupMember.destroy.mockResolvedValue(3);
    appDB.Resource.destroy.mockResolvedValue(4);
    appDB.sequelize.close.mockImplementation(() => Promise.resolve());
    appDB.sequelize.transaction.mockImplementation((callback) =>
      Promise.resolve(callback('transaction')),
    );
  });

  it('skips an app if getAppDB fails and continues cleaning up other apps', async () => {
    await cleanupDemoAppMembers();

    expect(getAppDB).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledWith(
      'Failed to connect to database for app 1, skipping cleanup.',
    );
    expect(appDB.sequelize.transaction).toHaveBeenCalledTimes(1);
    expect(appDB.GroupMember.destroy).toHaveBeenCalledTimes(1);
    expect(appDB.Resource.destroy).toHaveBeenCalledTimes(1);
    expect(appDB.AppMember.destroy).toHaveBeenCalledTimes(1);
    expect(appDB.sequelize.close).toHaveBeenCalledTimes(1);
  });
});

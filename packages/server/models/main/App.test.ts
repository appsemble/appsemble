import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App.js';
import { setArgv } from '../../utils/argv.js';

describe('App', () => {
  beforeEach(() => {
    setArgv({ databaseHost: 'main-db' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should skip dropping app database on soft delete', async () => {
    const query = vi.fn();

    await App.afterDestroyHook(
      {
        id: 42,
        dbHost: 'main-db',
        dbName: 'app-42',
        sequelize: { query },
      } as unknown as App,
      { force: false },
    );

    expect(query).not.toHaveBeenCalled();
  });

  it('should skip dropping app database when delete is not permanent', async () => {
    const query = vi.fn();

    await App.afterDestroyHook(
      {
        id: 42,
        dbHost: 'main-db',
        dbName: 'app-42',
        sequelize: { query },
      } as unknown as App,
      {},
    );

    expect(query).not.toHaveBeenCalled();
  });

  it('should skip dropping app database for external database hosts', async () => {
    const query = vi.fn();

    await App.afterDestroyHook(
      {
        id: 42,
        dbHost: 'external-db',
        dbName: 'app-42',
        sequelize: { query },
      } as unknown as App,
      { force: true },
    );

    expect(query).not.toHaveBeenCalled();
  });

  it('should terminate connections and drop app database on force delete', async () => {
    const query = vi.fn();

    await App.afterDestroyHook(
      {
        id: 42,
        dbHost: 'main-db',
        dbName: 'app"42',
        sequelize: { query },
      } as unknown as App,
      { force: true },
    );

    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining('pg_terminate_backend'), {
      replacements: { appDatabaseName: 'app"42' },
    });
    expect(query).toHaveBeenNthCalledWith(2, 'DROP DATABASE IF EXISTS "app""42";');
  });

  it('should defer database drop until transaction commit', async () => {
    const query = vi.fn();
    const afterCommit = vi.fn();

    await App.afterDestroyHook(
      {
        id: 42,
        dbHost: 'main-db',
        dbName: 'app-42',
        sequelize: { query },
      } as unknown as App,
      {
        force: true,
        transaction: {
          afterCommit,
        },
      } as any,
    );

    expect(afterCommit).toHaveBeenCalledTimes(1);
    expect(query).not.toHaveBeenCalled();

    const [onCommit] = afterCommit.mock.calls[0];
    await onCommit();

    expect(query).toHaveBeenCalledTimes(2);
  });

  it('should only drop the permanently deleted app database and not affect other instances', async () => {
    const deletedAppQuery = vi.fn();
    const otherAppQuery = vi.fn();

    await App.afterDestroyHook(
      {
        id: 42,
        dbHost: 'main-db',
        sequelize: { query: deletedAppQuery },
      } as unknown as App,
      { force: true },
    );

    await App.afterDestroyHook(
      {
        id: 24,
        dbHost: 'main-db',
        dbName: 'app-24',
        sequelize: { query: otherAppQuery },
      } as unknown as App,
      { force: false },
    );

    expect(otherAppQuery).not.toHaveBeenCalled();
    expect(deletedAppQuery).toHaveBeenCalledTimes(2);
    expect(deletedAppQuery).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('pg_terminate_backend'),
      {
        replacements: { appDatabaseName: 'app-42' },
      },
    );
    expect(deletedAppQuery).toHaveBeenNthCalledWith(2, 'DROP DATABASE IF EXISTS "app-42";');
  });
});

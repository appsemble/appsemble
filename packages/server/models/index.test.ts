import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { App, dropAndCloseAllAppDBs, getAppDB, Organization } from './index.js';
import { updateArgv } from '../utils/argv.js';

function createApp(path: string, overrides: Record<string, unknown> = {}): Promise<App> {
  return App.create({
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
    },
    dbName: `app-db-cache-test-${randomUUID()}`,
    path,
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: 'testorganization',
    ...overrides,
  });
}

describe('getAppDB', () => {
  beforeEach(async () => {
    updateArgv({ appDbCacheLimit: 2 });
    await Organization.create({
      name: 'Test Organization',
      id: 'testorganization',
    });
  });

  it('should return the cached instance on subsequent calls', async () => {
    const app = await createApp('test-app');
    const first = await getAppDB(app.id);
    const second = await getAppDB(app.id);
    expect(second).toBe(first);
  });

  it('should share one instance between concurrent calls', async () => {
    const app = await createApp('test-app');
    const [first, second] = await Promise.all([getAppDB(app.id), getAppDB(app.id)]);
    expect(second).toBe(first);
    expect(await first.AppMember.findAll()).toStrictEqual([]);
  });

  it('should evict the least recently used app database beyond the cache limit', async () => {
    const app1 = await createApp('test-app-1');
    const app2 = await createApp('test-app-2');
    const app3 = await createApp('test-app-3');

    const db1 = await getAppDB(app1.id);
    const db2 = await getAppDB(app2.id);
    // Using app 1 again makes app 2 the least recently used entry.
    await getAppDB(app1.id);
    await getAppDB(app3.id);

    // Evicted instances drain lazily, so callers holding a reference can finish their queries.
    expect(await db2.AppMember.findAll()).toStrictEqual([]);
    expect(await db1.AppMember.findAll()).toStrictEqual([]);

    // A new request for the evicted app gets a fresh instance.
    const db2Again = await getAppDB(app2.id);
    expect(db2Again).not.toBe(db2);
    expect(await db2Again.AppMember.findAll()).toStrictEqual([]);

    // The evicted instance is closed once it has been idle for a full check interval.
    await vi.waitFor(
      () =>
        expect(db2.AppMember.findAll()).rejects.toThrow(
          'ConnectionManager.getConnection was called after the connection manager was closed!',
        ),
      { timeout: 30_000, interval: 2000 },
    );
  });

  it('should keep a replaced app database usable while it drains', async () => {
    const app = await createApp('test-app');
    const before = await getAppDB(app.id);
    const after = await getAppDB(app.id, undefined, undefined, true);

    expect(after).not.toBe(before);
    // References from before the replacement, such as in-flight requests, keep working.
    expect(await before.AppMember.findAll()).toStrictEqual([]);
    expect(await after.AppMember.findAll()).toStrictEqual([]);
    expect(await getAppDB(app.id)).toBe(after);
  });

  it('should not close a displaced app database while it is actively used', async () => {
    const app = await createApp('test-app');
    const before = await getAppDB(app.id);
    await getAppDB(app.id, undefined, undefined, true);

    // Keep the displaced pool busy across the first idle check (10s), then query again: the
    // instance must only be closed at a check where its pool is fully idle.
    await before.sequelize.query('SELECT pg_sleep(11)');
    expect(await before.AppMember.findAll()).toStrictEqual([]);
  });

  it('should reject and not cache anything when the app database is unreachable', async () => {
    const app = await createApp('broken-app', { dbHost: '127.0.0.1', dbPort: 1 });
    await expect(getAppDB(app.id)).rejects.toThrow('ConnectionRefusedError');
    await expect(getAppDB(app.id)).rejects.toThrow('ConnectionRefusedError');
  });

  it('should drop and close all app databases even when a cached connection is already closed', async () => {
    const app = await createApp('test-app');
    const db = await getAppDB(app.id);

    // An interrupted teardown can leave a closed connection in the cache. Dropping and closing all
    // app databases must tolerate that instead of throwing and failing this and every subsequent
    // teardown.
    await db.sequelize.close();
    await dropAndCloseAllAppDBs();

    // The cache is left clean, so a fresh instance can still be created afterwards.
    const fresh = await getAppDB(app.id);
    expect(fresh).not.toBe(db);
    expect(await fresh.AppMember.findAll()).toStrictEqual([]);
  });
});

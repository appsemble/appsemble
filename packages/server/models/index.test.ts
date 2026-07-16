import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import { App, getAppDB, Organization } from './index.js';
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

  it('should close and evict the least recently used app database beyond the cache limit', async () => {
    const app1 = await createApp('test-app-1');
    const app2 = await createApp('test-app-2');
    const app3 = await createApp('test-app-3');

    const db1 = await getAppDB(app1.id);
    const db2 = await getAppDB(app2.id);
    // Using app 1 again makes app 2 the least recently used entry.
    await getAppDB(app1.id);
    await getAppDB(app3.id);

    await expect(db2.AppMember.findAll()).rejects.toThrowError(
      'ConnectionManager.getConnection was called after the connection manager was closed!',
    );
    expect(await db1.AppMember.findAll()).toStrictEqual([]);

    const db2Again = await getAppDB(app2.id);
    expect(db2Again).not.toBe(db2);
    expect(await db2Again.AppMember.findAll()).toStrictEqual([]);
  });

  it('should reject and not cache anything when the app database is unreachable', async () => {
    const app = await createApp('broken-app', { dbHost: '127.0.0.1', dbPort: 1 });
    await expect(getAppDB(app.id)).rejects.toThrowError('ConnectionRefusedError');
    await expect(getAppDB(app.id)).rejects.toThrowError('ConnectionRefusedError');
  });
});

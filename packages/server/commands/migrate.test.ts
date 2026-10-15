import { randomUUID } from 'node:crypto';

import { QueryTypes } from 'sequelize';
import { describe, expect, it } from 'vitest';

import { migrateAppDatabases } from './migrate.js';
import { migrations } from '../migrations/apps/index.js';
import { App, getAppDB, getDB, Organization } from '../models/index.js';

describe('migrateAppDatabases', () => {
  it('should migrate the database of a soft-deleted app so the app can be restored', async () => {
    await Organization.create({ id: 'testorganization', name: 'Test Organization' });
    const app = await App.create({
      definition: { name: 'Deleted App', defaultPage: 'Test Page' },
      dbName: `app-migrate-test-${randomUUID()}`,
      path: 'deleted-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
    });
    await app.destroy();

    await migrateAppDatabases(getDB());

    // The database only comes into existence when the migrate run opens it, so its presence proves
    // the soft-deleted app was included.
    const databases = await getDB().query('SELECT 1 FROM pg_database WHERE datname = :name', {
      replacements: { name: app.dbName },
      type: QueryTypes.SELECT,
    });
    expect(databases).toHaveLength(1);
    const { sequelize } = await getAppDB(app.id);
    const [{ version }] = await sequelize.query<{ version: string }>('SELECT version FROM "Meta"', {
      type: QueryTypes.SELECT,
    });
    expect(version).toBe(migrations.at(-1)!.key);
  });
});

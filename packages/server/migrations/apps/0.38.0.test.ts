import { QueryTypes } from 'sequelize';
import { describe, expect, it } from 'vitest';

import { up } from './0.38.0.js';
import { App, getAppDB, Organization } from '../../models/index.js';

async function seedApp(): Promise<number> {
  await Organization.create({ id: 'testorganization', name: 'Test Organization' });
  const app = await App.create({
    OrganizationId: 'testorganization',
    definition: { name: 'Test App', defaultPage: 'Test' },
    path: 'test-app',
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
  });
  return app.id;
}

describe('migration 0.38.0', () => {
  it('converts Resource into a LIST-partitioned table, preserving and routing existing rows', async () => {
    const appId = await seedApp();
    const { sequelize } = await getAppDB(appId);

    // Seed old-shape rows in the single Resource table (as it exists pre-0.38.0).
    await sequelize.query(`
      INSERT INTO "Resource" (type, data, created, updated) VALUES
        ('training', '{"title":"algebra"}', now(), now()),
        ('training', '{"title":"calculus"}', now(), now()),
        ('course',   '{"trainingId":1,"name":"c1"}', now(), now())`);

    await sequelize.transaction((transaction) => up(transaction, sequelize));

    // Resource is now a partitioned table (relkind 'p').
    const [{ relkind }] = await sequelize.query<{ relkind: string }>(
      `SELECT relkind FROM pg_class WHERE relname = 'Resource'`,
      { type: QueryTypes.SELECT },
    );
    expect(relkind).toBe('p');

    // Rows are preserved and each type lives in its own partition.
    const grouped = await sequelize.query<{ partition: string; type: string; c: number }>(
      `SELECT (tableoid::regclass)::text AS partition, type, count(*)::int AS c
         FROM "Resource" GROUP BY 1, 2 ORDER BY type`,
      { type: QueryTypes.SELECT },
    );
    expect(grouped).toHaveLength(2);
    const course = grouped.find((r) => r.type === 'course')!;
    const training = grouped.find((r) => r.type === 'training')!;
    expect(course.c).toBe(1);
    expect(training.c).toBe(2);
    expect(course.partition).not.toBe(training.partition);

    // Payload survives intact.
    const [row] = await sequelize.query<{ data: { name: string } }>(
      `SELECT data FROM "Resource" WHERE type = 'course'`,
      { type: QueryTypes.SELECT },
    );
    expect(row.data.name).toBe('c1');
  });

  it('backfills ResourceType on aux tables, wires composite FKs that cascade, and drops Resource_old', async () => {
    const appId = await seedApp();
    const { sequelize } = await getAppDB(appId);

    await sequelize.query(`
      INSERT INTO "Resource" (type, data, created, updated) VALUES
        ('training', '{"t":1}', now(), now()),
        ('course',   '{"c":1}', now(), now())`);
    const [{ id: rid }] = await sequelize.query<{ id: number }>(
      `SELECT id FROM "Resource" WHERE type = 'training' LIMIT 1`,
      { type: QueryTypes.SELECT },
    );
    await sequelize.query(
      `INSERT INTO "Asset" (id, name, clonable, seed, ephemeral, created, updated, "ResourceId")
         VALUES (gen_random_uuid(), 'f1', false, false, false, now(), now(), :rid)`,
      { replacements: { rid } },
    );
    await sequelize.query(
      `INSERT INTO "ResourceVersion" (id, data, created, "ResourceId")
         VALUES (gen_random_uuid(), '{}', now(), :rid)`,
      { replacements: { rid } },
    );

    await sequelize.transaction((transaction) => up(transaction, sequelize));

    // ResourceType backfilled from the owning resource.
    const [asset] = await sequelize.query<{ ResourceType: string }>(
      `SELECT "ResourceType" FROM "Asset" WHERE name = 'f1'`,
      { type: QueryTypes.SELECT },
    );
    expect(asset.ResourceType).toBe('training');
    const [version] = await sequelize.query<{ ResourceType: string }>(
      `SELECT "ResourceType" FROM "ResourceVersion" WHERE "ResourceId" = :rid`,
      { replacements: { rid }, type: QueryTypes.SELECT },
    );
    expect(version.ResourceType).toBe('training');

    // Composite FK cascades: deleting the resource removes its asset and version.
    await sequelize.query(`DELETE FROM "Resource" WHERE id = :rid AND type = 'training'`, {
      replacements: { rid },
    });
    const [{ assets }] = await sequelize.query<{ assets: number }>(
      `SELECT count(*)::int AS assets FROM "Asset" WHERE name = 'f1'`,
      { type: QueryTypes.SELECT },
    );
    expect(assets).toBe(0);
    const [{ versions }] = await sequelize.query<{ versions: number }>(
      `SELECT count(*)::int AS versions FROM "ResourceVersion" WHERE "ResourceId" = :rid`,
      { replacements: { rid }, type: QueryTypes.SELECT },
    );
    expect(versions).toBe(0);

    // ResourceSubscription also gains a composite FK to Resource(id, type).
    const [{ fks }] = await sequelize.query<{ fks: number }>(
      `SELECT count(*)::int AS fks FROM pg_constraint
         WHERE conrelid = '"ResourceSubscription"'::regclass AND contype = 'f'
           AND confrelid = '"Resource"'::regclass AND cardinality(conkey) = 2`,
      { type: QueryTypes.SELECT },
    );
    expect(fks).toBeGreaterThanOrEqual(1);

    // The old single table is gone.
    const [{ old }] = await sequelize.query<{ old: string | null }>(
      `SELECT to_regclass('"Resource_old"')::text AS old`,
      { type: QueryTypes.SELECT },
    );
    expect(old).toBeNull();
  });
});

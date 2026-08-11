import { type AppDefinition } from '@appsemble/lang-sdk';
import { QueryTypes, type Sequelize } from 'sequelize';
import { describe, expect, it } from 'vitest';

import { down, up } from './0.38.0.js';
import { App, getAppDB, Organization } from '../../models/index.js';
import { syncAppDefinitionIndexes } from '../../utils/appDefinitionIndexes.js';

const defaultDefinition = {
  name: 'Test App',
  defaultPage: 'Test',
} satisfies Partial<AppDefinition>;

async function seedApp(definition: Partial<AppDefinition> = defaultDefinition): Promise<number> {
  await Organization.create({ id: 'testorganization', name: 'Test Organization' });
  const app = await App.create({
    OrganizationId: 'testorganization',
    definition,
    path: 'test-app',
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
  });
  return app.id;
}

/**
 * Revert an app database to the pre-0.38.0 single-table shape.
 *
 * The migration is registered, so `getAppDB` already partitions the database; dropping it back to a
 * plain `Resource` table lets these tests exercise the actual data-migration path a production backup
 * will hit. `up()` recreates the table with `LIKE`, so only the columns it copies need to exist here.
 *
 * @param sequelize The app database connection.
 */
async function regressToSingleTable(sequelize: Sequelize): Promise<void> {
  await sequelize.query('DROP TABLE IF EXISTS "Resource" CASCADE');
  // The registered migration detaches this sequence (OWNED BY NONE), so it survives the drop above.
  await sequelize.query('DROP SEQUENCE IF EXISTS "Resource_id_seq" CASCADE');
  await sequelize.query(`CREATE TABLE "Resource" (
    id serial PRIMARY KEY,
    type text NOT NULL,
    data jsonb NOT NULL,
    clonable boolean NOT NULL DEFAULT false,
    seed boolean NOT NULL DEFAULT false,
    ephemeral boolean NOT NULL DEFAULT false,
    expires timestamptz,
    "Position" numeric,
    created timestamptz NOT NULL DEFAULT now(),
    updated timestamptz NOT NULL DEFAULT now(),
    deleted timestamptz,
    "GroupId" integer,
    "AuthorId" uuid,
    "EditorId" uuid)`);
}

describe('migration 0.38.0', () => {
  it('converts Resource into a LIST-partitioned table, preserving and routing existing rows', async () => {
    const appId = await seedApp();
    const { sequelize } = await getAppDB(appId);
    await regressToSingleTable(sequelize);

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

  it('enforces definition unique indexes after migrating an existing app database', async () => {
    const definition = {
      defaultPage: 'Test',
      name: 'Test App',
      resources: {
        customer: {
          schema: {
            type: 'object',
            properties: { email: { type: 'string' } },
          },
          unique: ['email'],
        },
      },
    } satisfies Partial<AppDefinition>;
    const appId = await seedApp(definition);
    const { sequelize } = await getAppDB(appId);
    await regressToSingleTable(sequelize);

    await sequelize.query(`
      INSERT INTO "Resource" (type, data, created, updated)
      VALUES ('customer', '{"email":"taken@example.com"}', now(), now())`);

    await sequelize.transaction((transaction) => up(transaction, sequelize));
    await sequelize.transaction((transaction) =>
      syncAppDefinitionIndexes({
        appId,
        resources: definition.resources,
        sequelize,
        transaction,
      }),
    );

    await expect(
      sequelize.query(
        `INSERT INTO "Resource" (type, data, created, updated)
         VALUES ('customer', '{"email":"taken@example.com"}', now(), now())`,
      ),
    ).rejects.toMatchObject({
      parent: { code: '23505' },
    });
  });

  it('backfills ResourceType on aux tables, wires composite FKs that cascade, and drops Resource_old', async () => {
    const appId = await seedApp();
    const { sequelize } = await getAppDB(appId);
    await regressToSingleTable(sequelize);

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

  it('converts the partitioned Resource table back to the single-table shape', async () => {
    const appId = await seedApp();
    const { sequelize } = await getAppDB(appId);
    await regressToSingleTable(sequelize);

    await sequelize.query(`
      INSERT INTO "Resource" (type, data, created, updated) VALUES
        ('training', '{"t":1}', now(), now()),
        ('course',   '{"c":1}', now(), now())`);
    await sequelize.transaction((transaction) => up(transaction, sequelize));
    await sequelize.query(
      `INSERT INTO "Resource" (type, data, created, updated)
         VALUES ('lesson', '{"l":1}', now(), now())`,
    );

    await sequelize.transaction((transaction) => down(transaction, sequelize));

    const [{ relkind }] = await sequelize.query<{ relkind: string }>(
      `SELECT relkind FROM pg_class WHERE relname = 'Resource'`,
      { type: QueryTypes.SELECT },
    );
    expect(relkind).toBe('r');

    const [{ resourceTypeColumn }] = await sequelize.query<{ resourceTypeColumn: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'Asset' AND column_name = 'ResourceType'
       ) AS "resourceTypeColumn"`,
      { type: QueryTypes.SELECT },
    );
    expect(resourceTypeColumn).toBe(false);

    const [{ resources }] = await sequelize.query<{ resources: number }>(
      `SELECT count(*)::int AS resources FROM "Resource"`,
      { type: QueryTypes.SELECT },
    );
    expect(resources).toBe(3);

    const [{ fks }] = await sequelize.query<{ fks: number }>(
      `SELECT count(*)::int AS fks FROM pg_constraint
         WHERE conrelid IN (
           '"Asset"'::regclass,
           '"ResourceVersion"'::regclass,
           '"ResourceSubscription"'::regclass
         )
           AND contype = 'f'
           AND confrelid = '"Resource"'::regclass
           AND cardinality(conkey) = 1`,
      { type: QueryTypes.SELECT },
    );
    expect(fks).toBe(3);
  });
});

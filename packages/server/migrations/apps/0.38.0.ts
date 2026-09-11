import { QueryTypes, type Sequelize, type Transaction } from 'sequelize';

import { addResourceCompositeForeignKeys } from '../../utils/resourceForeignKeys.js';
import { resourcePartitionName } from '../../utils/resourcePartition.js';

export const key = '0.38.0';

async function alignResourceIdSequence(db: Sequelize, transaction: Transaction): Promise<void> {
  await db.query(
    `WITH resource_state AS (
       SELECT COALESCE(MAX(id), 0) AS max_id FROM "Resource"
     ), sequence_state AS (
       SELECT last_value, is_called FROM "Resource_id_seq"
     )
     SELECT setval(
       '"Resource_id_seq"',
       CASE
         WHEN resource_state.max_id = 0 AND NOT sequence_state.is_called THEN sequence_state.last_value
         ELSE GREATEST(resource_state.max_id, sequence_state.last_value, 1)
       END,
       resource_state.max_id > 0 OR sequence_state.is_called
     )
     FROM resource_state, sequence_state`,
    { transaction },
  );
}

/**
 * Summary:
 * - Convert the single `Resource` table into a LIST-partitioned table on `type` (one partition per
 * resource type), with a composite primary key `(id, type)`. Existing rows are copied into their
 * type partition; the global id sequence is preserved.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const [existing] = await db.query<{ relkind: string }>(
    `SELECT relkind FROM pg_class WHERE relname = 'Resource'`,
    { type: QueryTypes.SELECT, transaction },
  );
  // Already partitioned: nothing to do (idempotent re-run).
  if (existing?.relkind === 'p') {
    return;
  }

  const types = (
    await db.query<{ type: string }>('SELECT DISTINCT type FROM "Resource"', {
      type: QueryTypes.SELECT,
      transaction,
    })
  ).map((row) => row.type);

  await db.query('ALTER TABLE "Resource" RENAME TO "Resource_old"', { transaction });
  // Free the `Resource_pkey` constraint name so the new partitioned table's primary key reuses it.
  await db.query(
    'ALTER TABLE "Resource_old" RENAME CONSTRAINT "Resource_pkey" TO "Resource_old_pkey"',
    { transaction },
  );

  await db.query(
    `CREATE TABLE "Resource" (LIKE "Resource_old" INCLUDING DEFAULTS, PRIMARY KEY (id, type))
       PARTITION BY LIST (type)`,
    { transaction },
  );

  for (const type of types) {
    await db.query(
      `CREATE TABLE "${resourcePartitionName(type)}" PARTITION OF "Resource" FOR VALUES IN (:type)`,
      { replacements: { type }, transaction },
    );
  }

  // Catch-all partition so resources of a type without a dedicated partition are still storable.
  // Dedicated per-type partitions are created ahead of their data when the app definition is synced.
  await db.query('CREATE TABLE "resource_default" PARTITION OF "Resource" DEFAULT', {
    transaction,
  });

  await db.query('INSERT INTO "Resource" SELECT * FROM "Resource_old"', { transaction });

  // Aux tables need the resource type to form a composite foreign key to the partitioned parent.
  // Asset and ResourceVersion gain a ResourceType column, backfilled from the owning resource;
  // ResourceSubscription already carries the type in its `type` column.
  for (const table of ['Asset', 'ResourceVersion']) {
    await db.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "ResourceType" VARCHAR(255)`, {
      transaction,
    });
    await db.query(
      `UPDATE "${table}" AS child SET "ResourceType" = old.type
         FROM "Resource_old" AS old WHERE child."ResourceId" = old.id`,
      { transaction },
    );
  }

  // Detach the id sequence so dropping Resource_old does not drop it; the partitioned Resource keeps
  // drawing ids from the same global sequence.
  const [{ seq }] = await db.query<{ seq: string | null }>(
    `SELECT pg_get_serial_sequence('"Resource_old"', 'id') AS seq`,
    { type: QueryTypes.SELECT, transaction },
  );
  if (seq) {
    await db.query(`ALTER SEQUENCE ${seq} OWNED BY NONE`, { transaction });
  }

  await alignResourceIdSequence(db, transaction);

  // Dropping the old table removes the single-column foreign keys that referenced it.
  await db.query('DROP TABLE "Resource_old" CASCADE', { transaction });

  // A GIN index on the JSONB payload, on the parent so every partition inherits it. Created after
  // dropping the old table so the reused index name is free.
  await db.query('CREATE INDEX "resourceDataIndex" ON "Resource" USING GIN (data)', {
    transaction,
  });
  await db.query('CREATE INDEX "resourceTypeComposite" ON "Resource" (type, expires, "GroupId")', {
    transaction,
  });

  // LIKE does not copy foreign keys, so recreate the Resource-owned references dropped with the old
  // table (these match what syncing the models produces).
  await db.query(
    `ALTER TABLE "Resource" ADD CONSTRAINT "Resource_GroupId_fkey"
       FOREIGN KEY ("GroupId") REFERENCES "Group" (id) ON UPDATE CASCADE ON DELETE CASCADE`,
    { transaction },
  );
  await db.query(
    `ALTER TABLE "Resource" ADD CONSTRAINT "Resource_AuthorId_fkey"
       FOREIGN KEY ("AuthorId") REFERENCES "AppMember" (id) ON UPDATE CASCADE ON DELETE CASCADE`,
    { transaction },
  );
  await db.query(
    `ALTER TABLE "Resource" ADD CONSTRAINT "Resource_EditorId_fkey"
       FOREIGN KEY ("EditorId") REFERENCES "AppMember" (id) ON UPDATE CASCADE ON DELETE CASCADE`,
    { transaction },
  );

  await addResourceCompositeForeignKeys(db, transaction);
}

/**
 * Summary:
 * - Convert the partitioned `Resource` table back into a single table with a single-column primary
 * key, restoring the single-column aux foreign keys and dropping the `ResourceType` columns.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  await db.query('ALTER TABLE "Resource" RENAME TO "Resource_partitioned"', { transaction });
  await db.query(
    'ALTER TABLE "Resource_partitioned" RENAME CONSTRAINT "Resource_pkey" TO "Resource_partitioned_pkey"',
    { transaction },
  );
  await db.query(
    'CREATE TABLE "Resource" (LIKE "Resource_partitioned" INCLUDING DEFAULTS, PRIMARY KEY (id))',
    { transaction },
  );
  await db.query('INSERT INTO "Resource" SELECT * FROM "Resource_partitioned"', { transaction });
  await alignResourceIdSequence(db, transaction);
  // Dropping the partitioned table also drops its partitions and the composite foreign keys.
  await db.query('DROP TABLE "Resource_partitioned" CASCADE', { transaction });

  await db.query('CREATE INDEX "resourceDataIndex" ON "Resource" USING GIN (data)', {
    transaction,
  });
  await db.query('CREATE INDEX "resourceTypeComposite" ON "Resource" (type, expires, "GroupId")', {
    transaction,
  });
  await db.query(
    `ALTER TABLE "Resource" ADD CONSTRAINT "Resource_GroupId_fkey"
       FOREIGN KEY ("GroupId") REFERENCES "Group" (id) ON UPDATE CASCADE ON DELETE CASCADE`,
    { transaction },
  );
  await db.query(
    `ALTER TABLE "Resource" ADD CONSTRAINT "Resource_AuthorId_fkey"
       FOREIGN KEY ("AuthorId") REFERENCES "AppMember" (id) ON UPDATE CASCADE ON DELETE CASCADE`,
    { transaction },
  );
  await db.query(
    `ALTER TABLE "Resource" ADD CONSTRAINT "Resource_EditorId_fkey"
       FOREIGN KEY ("EditorId") REFERENCES "AppMember" (id) ON UPDATE CASCADE ON DELETE CASCADE`,
    { transaction },
  );

  await db.query('ALTER TABLE "Asset" DROP COLUMN IF EXISTS "ResourceType"', { transaction });
  await db.query('ALTER TABLE "ResourceVersion" DROP COLUMN IF EXISTS "ResourceType"', {
    transaction,
  });
  await db.query(
    `ALTER TABLE "Asset" ADD CONSTRAINT "Asset_ResourceId_fkey"
       FOREIGN KEY ("ResourceId") REFERENCES "Resource" (id) ON UPDATE CASCADE ON DELETE CASCADE`,
    { transaction },
  );
  await db.query(
    `ALTER TABLE "ResourceVersion" ADD CONSTRAINT "ResourceVersion_ResourceId_fkey"
       FOREIGN KEY ("ResourceId") REFERENCES "Resource" (id) ON UPDATE CASCADE ON DELETE CASCADE`,
    { transaction },
  );
  await db.query(
    `ALTER TABLE "ResourceSubscription" ADD CONSTRAINT "ResourceSubscription_ResourceId_fkey"
       FOREIGN KEY ("ResourceId") REFERENCES "Resource" (id) ON UPDATE CASCADE ON DELETE CASCADE`,
    { transaction },
  );
}

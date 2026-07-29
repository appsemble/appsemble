import { QueryTypes, type Sequelize, type Transaction } from 'sequelize';

import { resourcePartitionName } from '../../utils/resourcePartition.js';

export const key = '0.38.0';

/**
 * Summary:
 * - Convert the single `Resource` table into a LIST-partitioned table on `type` (one partition per
 *   resource type), with a composite primary key `(id, type)`. Existing rows are copied into their
 *   type partition; the global id sequence is preserved.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const types = (
    await db.query<{ type: string }>('SELECT DISTINCT type FROM "Resource"', {
      type: QueryTypes.SELECT,
      transaction,
    })
  ).map((row) => row.type);

  await db.query('ALTER TABLE "Resource" RENAME TO "Resource_old"', { transaction });

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

  await db.query('INSERT INTO "Resource" SELECT * FROM "Resource_old"', { transaction });
}

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  await db.query('DROP TABLE IF EXISTS "Resource" CASCADE', { transaction });
  await db.query('ALTER TABLE "Resource_old" RENAME TO "Resource"', { transaction });
}

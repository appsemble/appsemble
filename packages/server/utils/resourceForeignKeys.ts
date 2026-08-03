import { type Sequelize, type Transaction } from 'sequelize';

const resourceForeignKeys = [
  { table: 'Asset', typeColumn: 'ResourceType', constraint: 'Asset_Resource_fkey' },
  {
    table: 'ResourceVersion',
    typeColumn: 'ResourceType',
    constraint: 'ResourceVersion_Resource_fkey',
  },
  {
    table: 'ResourceSubscription',
    typeColumn: 'type',
    constraint: 'ResourceSubscription_Resource_fkey',
  },
] as const;

/**
 * Add the composite foreign keys from resource-owned tables to the partitioned `Resource` table.
 *
 * A foreign key to a partitioned table must reference its full primary key `(id, type)`, which a
 * Sequelize (typescript) association cannot express. This shared DDL is applied both by the `0.38.0`
 * migration and by an `afterBulkSync` hook, so the schema produced by the migrations matches the
 * schema produced by syncing the models.
 *
 * The constraints use fixed names and can be applied by either path, so each is dropped before it is
 * (re)added, keeping the function idempotent when both paths run against the same database.
 * `ON UPDATE CASCADE ON DELETE CASCADE` preserves the behavior of the single-column foreign keys
 * these replace.
 *
 * @param sequelize The app database connection.
 * @param transaction The surrounding transaction, if any.
 */
export async function addResourceCompositeForeignKeys(
  sequelize: Sequelize,
  transaction?: Transaction,
): Promise<void> {
  for (const { constraint, table, typeColumn } of resourceForeignKeys) {
    await sequelize.query(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraint}"`, {
      transaction,
    });
    await sequelize.query(
      `ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}"
         FOREIGN KEY ("ResourceId", "${typeColumn}") REFERENCES "Resource" (id, type)
         ON UPDATE CASCADE ON DELETE CASCADE`,
      { transaction },
    );
  }
}

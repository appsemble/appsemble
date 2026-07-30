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
 * migration and by an `afterSync` hook, so the schema produced by the migrations matches the schema
 * produced by syncing the models.
 *
 * @param sequelize The app database connection.
 * @param transaction The surrounding transaction, if any.
 */
export async function addResourceCompositeForeignKeys(
  sequelize: Sequelize,
  transaction?: Transaction,
): Promise<void> {
  for (const { constraint, table, typeColumn } of resourceForeignKeys) {
    await sequelize.query(
      `ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}"
         FOREIGN KEY ("ResourceId", "${typeColumn}") REFERENCES "Resource" (id, type) ON DELETE CASCADE`,
      { transaction },
    );
  }
}

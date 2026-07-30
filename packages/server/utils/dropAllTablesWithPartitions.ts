import { QueryTypes, type Sequelize } from 'sequelize';

/**
 * Drop every table in the public schema, including partitioned tables.
 *
 * Sequelize's `dropAllTables` cannot drop the inherited foreign-key constraints that a composite
 * foreign key to a partitioned table creates, so partitioned parents are dropped first — together
 * with their partitions and dependent constraints. Any sequence left orphaned afterwards (such as the
 * resource id sequence the 0.38.0 migration detaches) is dropped too, so a subsequent migration run
 * can recreate its serial columns.
 *
 * @param sequelize The database connection to clear.
 */
export async function dropAllTablesWithPartitions(sequelize: Sequelize): Promise<void> {
  const partitioned = await sequelize.query<{ name: string }>(
    `SELECT relname AS name FROM pg_class WHERE relkind = 'p' AND relnamespace = 'public'::regnamespace`,
    { type: QueryTypes.SELECT },
  );
  for (const { name } of partitioned) {
    await sequelize.query(`DROP TABLE IF EXISTS "${name}" CASCADE`);
  }

  await sequelize.getQueryInterface().dropAllTables();

  const sequences = await sequelize.query<{ name: string }>(
    `SELECT relname AS name FROM pg_class WHERE relkind = 'S' AND relnamespace = 'public'::regnamespace`,
    { type: QueryTypes.SELECT },
  );
  for (const { name } of sequences) {
    await sequelize.query(`DROP SEQUENCE IF EXISTS "${name}" CASCADE`);
  }
}

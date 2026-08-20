import { QueryTypes, type Sequelize } from 'sequelize';

/**
 * Drop Appsemble's tables, including the partitioned Resource table.
 *
 * Sequelize's `dropAllTables` cannot drop the inherited foreign-key constraints that a composite
 * foreign key to a partitioned table creates, so the Resource partitioned parent is dropped first
 * together with its partitions and dependent constraints. The detached resource id sequence is
 * dropped afterwards, so a subsequent migration run can recreate its serial column.
 *
 * @param sequelize The database connection to clear.
 */
export async function dropAllTablesWithPartitions(sequelize: Sequelize): Promise<void> {
  const partitioned = await sequelize.query<{ name: string }>(
    `SELECT relname AS name
       FROM pg_class
       WHERE relkind = 'p'
         AND relnamespace = 'public'::regnamespace
         AND relname = 'Resource'`,
    { type: QueryTypes.SELECT },
  );
  for (const { name } of partitioned) {
    await sequelize.query(`DROP TABLE IF EXISTS "${name}" CASCADE`);
  }

  await sequelize.getQueryInterface().dropAllTables();

  const sequences = await sequelize.query<{ name: string }>(
    `SELECT relname AS name
       FROM pg_class
       WHERE relkind = 'S'
         AND relnamespace = 'public'::regnamespace
         AND relname = 'Resource_id_seq'`,
    { type: QueryTypes.SELECT },
  );
  for (const { name } of sequences) {
    await sequelize.query(`DROP SEQUENCE IF EXISTS "${name}" CASCADE`);
  }
}

import { logger } from '@appsemble/node-utils';
import { type Sequelize, type Transaction } from 'sequelize';

import { argv } from '../../utils/argv.js';

export const key = '0.37.1-test.0';

/**
 * Summary:
 * - Point managed app databases at the current database endpoint
 *
 * When PgBouncer sits between Appsemble and PostgreSQL, `DATABASE_HOST` points at PgBouncer while
 * existing `App` rows still store the direct PostgreSQL host. Those apps would bypass PgBouncer,
 * and the managed database checks in `initAppDB` and `App.afterDestroy` (which compare `dbHost`
 * with `DATABASE_HOST`) would treat them as external. The direct endpoint is provided through
 * `DATABASE_DIRECT_HOST`/`DATABASE_DIRECT_PORT`; without it this migration is a no-op.
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const directHost = process.env.DATABASE_DIRECT_HOST;
  const directPort = Number(process.env.DATABASE_DIRECT_PORT) || 5432;
  const host = argv.databaseHost || process.env.DATABASE_HOST;
  const port = argv.databasePort || Number(process.env.DATABASE_PORT);

  if (!directHost || !host || !port || directHost === host) {
    logger.info('No separate direct database endpoint is configured. Nothing to update.');
    return;
  }

  logger.info(`Point managed app databases from ${directHost}:${directPort} to ${host}:${port}`);
  await db.query(
    'UPDATE "App" SET "dbHost" = ?, "dbPort" = ? WHERE "dbHost" = ? AND "dbPort" = ?',
    { replacements: [host, port, directHost, directPort], transaction },
  );
}

/**
 * Summary:
 * - Point managed app databases back at the direct database endpoint
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const directHost = process.env.DATABASE_DIRECT_HOST;
  const directPort = Number(process.env.DATABASE_DIRECT_PORT) || 5432;
  const host = argv.databaseHost || process.env.DATABASE_HOST;
  const port = argv.databasePort || Number(process.env.DATABASE_PORT);

  if (!directHost || !host || !port || directHost === host) {
    logger.info('No separate direct database endpoint is configured. Nothing to update.');
    return;
  }

  logger.info(`Point managed app databases from ${host}:${port} to ${directHost}:${directPort}`);
  await db.query(
    'UPDATE "App" SET "dbHost" = ?, "dbPort" = ? WHERE "dbHost" = ? AND "dbPort" = ?',
    { replacements: [directHost, directPort, host, port], transaction },
  );
}

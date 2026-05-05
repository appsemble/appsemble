import { logger } from '@appsemble/node-utils';
import { type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.10-test.3';

/**
 * Summary:
 * - Backfill missing `AppMemberAssignedRole` rows from the legacy `AppMember.role` shim.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  logger.info(
    'Backfilling missing `AppMemberAssignedRole` rows from compatibility `AppMember.role`',
  );
  await db.query(
    `
      INSERT INTO "AppMemberAssignedRole" ("AppMemberId", role, source, created, updated)
      SELECT id, role, 'manual', created, updated
      FROM "AppMember"
      WHERE role IS NOT NULL
      ON CONFLICT ("AppMemberId", role) DO NOTHING
    `,
    { transaction },
  );
}

/**
 * Summary:
 * - No-op down migration for legacy role backfill data.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 * @returns A resolved promise because this migration only backfills data.
 */
export function down(transaction: Transaction, db: Sequelize): Promise<void> {
  if (!transaction || !db) {
    throw new Error('Expected migration context for down()');
  }

  logger.info('No schema changes to revert for `AppMember.role` compatibility backfill');
  return Promise.resolve();
}

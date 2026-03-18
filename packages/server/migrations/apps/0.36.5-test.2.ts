import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.5-test.2';

/**
 * Summary:
 * - Re-introduce `AppMember.role` as a nullable compatibility shim.
 * - Backfill `AppMember.role` from `AppMemberAssignedRole`.
 * - Preserve legacy `AppMember.role` values for compatibility with direct inserts.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding nullable compatibility column `AppMember.role`');
  await queryInterface.addColumn(
    'AppMember',
    'role',
    { type: DataTypes.STRING, allowNull: true },
    { transaction },
  );

  logger.info('Backfilling `AppMember.role` from `AppMemberAssignedRole`');
  await db.query(
    `
      UPDATE "AppMember"
      SET role = source.role
      FROM (
        SELECT DISTINCT ON ("AppMemberId") "AppMemberId", role
        FROM "AppMemberAssignedRole"
        ORDER BY "AppMemberId", created ASC, role ASC
      ) AS source
      WHERE "AppMember".id = source."AppMemberId"
    `,
    { transaction },
  );

  logger.info('Dropping legacy role compatibility trigger leftovers if present');
  await db.query(
    'DROP TRIGGER IF EXISTS "syncAppMemberAssignedRoleFromLegacyRole" ON "AppMember"',
    { transaction },
  );
  await db.query('DROP FUNCTION IF EXISTS "syncAppMemberAssignedRoleFromLegacyRole"()', {
    transaction,
  });
}

/**
 * Summary:
 * - Remove the legacy `AppMember.role` compatibility trigger.
 * - Drop the compatibility `AppMember.role` column.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Dropping legacy role compatibility trigger');
  await db.query(
    'DROP TRIGGER IF EXISTS "syncAppMemberAssignedRoleFromLegacyRole" ON "AppMember"',
    { transaction },
  );
  await db.query('DROP FUNCTION IF EXISTS "syncAppMemberAssignedRoleFromLegacyRole"()', {
    transaction,
  });

  logger.info('Dropping compatibility column `AppMember.role`');
  await queryInterface.removeColumn('AppMember', 'role', { transaction });
}

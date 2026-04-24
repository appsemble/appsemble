import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.5-test.4';

/**
 * Summary:
 * - Replace `AppInvite.role` with `AppInvite.roles`.
 * - Backfill existing app invite roles.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding `roles` column to `AppInvite`');
  await queryInterface.addColumn(
    'AppInvite',
    'roles',
    { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    { transaction },
  );

  logger.info('Backfilling `AppInvite.roles` from `AppInvite.role`');
  await db.query(
    `
      UPDATE "AppInvite"
      SET roles = CASE
        WHEN role IS NULL THEN '[]'::jsonb
        ELSE jsonb_build_array(role)
      END
    `,
    { transaction },
  );

  logger.info('Making `AppInvite.roles` required');
  await queryInterface.changeColumn(
    'AppInvite',
    'roles',
    { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    { transaction },
  );

  logger.info('Dropping `role` column from `AppInvite`');
  await queryInterface.removeColumn('AppInvite', 'role', { transaction });
}

/**
 * Summary:
 * - Restore `AppInvite.role`.
 * - Backfill it from the first entry of `AppInvite.roles`.
 * - Drop `AppInvite.roles`.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Restoring `role` column on `AppInvite`');
  await queryInterface.addColumn(
    'AppInvite',
    'role',
    { type: DataTypes.STRING, allowNull: true, defaultValue: 'Member' },
    { transaction },
  );

  logger.info('Backfilling `AppInvite.role` from `AppInvite.roles`');
  await db.query(
    `
      UPDATE "AppInvite"
      SET role = COALESCE(roles->>0, 'Member')
    `,
    { transaction },
  );

  logger.info('Making `AppInvite.role` required');
  await queryInterface.changeColumn(
    'AppInvite',
    'role',
    { type: DataTypes.STRING, allowNull: false, defaultValue: 'Member' },
    { transaction },
  );

  logger.info('Dropping `roles` column from `AppInvite`');
  await queryInterface.removeColumn('AppInvite', 'roles', { transaction });
}

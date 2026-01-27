import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.3';

/**
 * Summary:
 * - Add `totp` column to `App` table for controlling TOTP requirements.
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding `totp` column to `App` table');
  await queryInterface.addColumn(
    'App',
    'totp',
    {
      type: DataTypes.ENUM('disabled', 'enabled', 'required'),
      allowNull: false,
      defaultValue: 'disabled',
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove `totp` column from `App` table.
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing `totp` column from `App` table');
  await queryInterface.removeColumn('App', 'totp', { transaction });

  logger.info('Dropping `enum_App_totp` type');
  await db.query('DROP TYPE IF EXISTS "enum_App_totp";', { transaction });
}

import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.40.10';

/**
 * Summary:
 * - Add `sha256` column to `Asset` table to detect unchanged seed assets.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding `sha256` column to `Asset` table');
  await queryInterface.addColumn(
    'Asset',
    'sha256',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove `sha256` column from `Asset` table.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing `sha256` column from `Asset` table');
  await queryInterface.removeColumn('Asset', 'sha256', { transaction });
}

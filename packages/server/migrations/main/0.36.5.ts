import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.5';

/**
 * Summary:
 * - Add `repositoryUrl` column to `BlockVersion` table.
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding `repositoryUrl` column to `BlockVersion` table');
  await queryInterface.addColumn(
    'BlockVersion',
    'repositoryUrl',
    {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove `repositoryUrl` column from `BlockVersion` table.
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing `repositoryUrl` column from `BlockVersion` table');
  await queryInterface.removeColumn('BlockVersion', 'repositoryUrl', { transaction });
}

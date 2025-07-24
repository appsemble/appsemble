import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.34.1';

/**
 * Summary:
 * - Remove column `migratedAt` from `App` table
 *
 * Cleans up after 0.34.0
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `migratedAt` from `App` table');
  await queryInterface.removeColumn('App', 'migratedAt', { transaction });
}

/**
 * Summary:
 * - Add column `migratedAt` to `App` table*
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `migratedAt` to `App` table');
  await queryInterface.addColumn(
    'App',
    'migratedAt',
    { type: DataTypes.DATE, allowNull: true },
    { transaction },
  );
}

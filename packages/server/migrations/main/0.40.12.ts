import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.40.12';

/**
 * Summary:
 * - Add column `password` to table `App`
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `password` to table `App`');
  await queryInterface.addColumn('App', 'password', { type: DataTypes.STRING }, { transaction });
}

/**
 * Summary:
 * - Remove column `password` from table `App`
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `password` from table `App`');
  await queryInterface.removeColumn('App', 'password', { transaction });
}

import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.40.12';

/**
 * Summary:
 * - Add columns `password` and `passwordMessage` to table `App`
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `password` to table `App`');
  await queryInterface.addColumn('App', 'password', { type: DataTypes.STRING }, { transaction });

  logger.info('Add column `passwordMessage` to table `App`');
  await queryInterface.addColumn(
    'App',
    'passwordMessage',
    { type: DataTypes.TEXT },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove columns `password` and `passwordMessage` from table `App`
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `password` from table `App`');
  await queryInterface.removeColumn('App', 'password', { transaction });

  logger.info('Remove column `passwordMessage` from table `App`');
  await queryInterface.removeColumn('App', 'passwordMessage', { transaction });
}

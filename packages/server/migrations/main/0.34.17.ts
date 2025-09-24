import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.34.17';

/**
 * Summary:
 * - Add database config columns to `App` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `dbName` to `App` table');
  await queryInterface.addColumn('App', 'dbName', { type: DataTypes.STRING }, { transaction });

  logger.info('Add column `dbHost` to `App` table');
  await queryInterface.addColumn('App', 'dbHost', { type: DataTypes.STRING }, { transaction });

  logger.info('Add column `dbPort` to `App` table');
  await queryInterface.addColumn(
    'App',
    'dbPort',
    { type: DataTypes.INTEGER, validate: { min: 1, max: 65_535 } },
    { transaction },
  );

  logger.info('Add column `dbUser` to `App` table');
  await queryInterface.addColumn('App', 'dbUser', { type: DataTypes.STRING }, { transaction });

  logger.info('Add column `dbPassword` to `App` table');
  await queryInterface.addColumn('App', 'dbPassword', { type: DataTypes.BLOB }, { transaction });
}

/**
 * Summary:
 * - Remove database config columns from `App` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `dbName` from `App` table');
  await queryInterface.removeColumn('App', 'dbName', { transaction });

  logger.info('Remove column `dbHost` from `App` table');
  await queryInterface.removeColumn('App', 'dbHost', { transaction });

  logger.info('Remove column `dbPort` from `App` table');
  await queryInterface.removeColumn('App', 'dbPort', { transaction });

  logger.info('Remove column `dbUser` from `App` table');
  await queryInterface.removeColumn('App', 'dbUser', { transaction });

  logger.info('Remove column `dbPassword` from `App` table');
  await queryInterface.removeColumn('App', 'dbPassword', { transaction });
}

import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.35.15';

/**
 * Summary:
 * - Add msClarityID column to `App` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `msClarityID` to `App` table');
  await queryInterface.addColumn('App', 'msClarityID', { type: DataTypes.STRING }, { transaction });
}

/**
 * Summary:
 * - Remove msClarityID column from `App` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `msClarityID` from `App` table');
  await queryInterface.removeColumn('App', 'msClarityID', { transaction });
}

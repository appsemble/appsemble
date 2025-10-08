import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.35.7';

/**
 * Summary:
 * - Add metaPixelID column to `App` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `metaPixelID` to `App` table');
  await queryInterface.addColumn('App', 'metaPixelID', { type: DataTypes.STRING }, { transaction });
}

/**
 * Summary:
 * - Remove metaPixelID column from `App` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `metaPixelID` from `App` table');
  await queryInterface.removeColumn('App', 'metaPixelID', { transaction });
}

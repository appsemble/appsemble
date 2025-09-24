import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.30.14-test.4';

/**
 * Summary:
 * - Add column `ca` to `AppServiceSecret` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `ca` to `AppServiceSecret` table');
  await queryInterface.addColumn('AppServiceSecret', 'ca', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
}

/**
 * Summary:
 * - Remove column `ca` from `AppServiceSecret` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `ca` from `AppServiceSecret` table');
  await queryInterface.removeColumn('AppServiceSecret', 'ca');
}

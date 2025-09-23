import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.30.12';

/**
 * Summary:
 * - Add column `scope` to `AppServiceSecret` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `scope` to `AppServiceSecret` table');
  await queryInterface.addColumn('AppServiceSecret', 'scope', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

/**
 * Summary:
 * - Remove column `scope` from `AppServiceSecret` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `scope` from `AppServiceSecret` table');
  await queryInterface.removeColumn('AppServiceSecret', 'scope');
}

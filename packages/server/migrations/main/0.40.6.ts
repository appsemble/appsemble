import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.40.6';

/**
 * Summary:
 * - Add column `variables` to table `Theme`
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `variables` to table `Theme`');
  await queryInterface.addColumn(
    'Theme',
    'variables',
    { type: DataTypes.TEXT, allowNull: false, defaultValue: '{}' },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove column `variables` from table `Theme`
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `variables` from table `Theme`');
  await queryInterface.removeColumn('Theme', 'variables', { transaction });
}

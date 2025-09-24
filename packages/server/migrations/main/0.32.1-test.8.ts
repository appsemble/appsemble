import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.32.1-test.8';

/**
 * Summary:
 * - Add column `position` to table `Resource`.
 * - Add index `ResourcePositionUniqueIndex` to table `Resource`.
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding column `Position` to table `Resource`');
  await queryInterface.addColumn(
    'Resource',
    'Position',
    {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    { transaction },
  );
  logger.info('Adding unique index `ResourcePositionUniqueIndex` to table `Resource`');
  await queryInterface.addIndex('Resource', {
    name: 'ResourcePositionUniqueIndex',
    unique: true,
    fields: ['Position', 'AppId', 'type'],
    transaction,
  });
}

/**
 * Summary:
 * - Remove index `ResourcePositionUniqueIndex` from table `Resource`.
 * - Remove column `position` from table `Resource`.
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Removing unique index `ResourcePositionUniqueIndex` from table `Resource`');
  await queryInterface.removeIndex('Resource', 'ResourcePositionUniqueIndex', { transaction });
  logger.warn('Removing column `Position` from table `Resource`');
  await queryInterface.removeColumn('Resource', 'Position', { transaction });
}

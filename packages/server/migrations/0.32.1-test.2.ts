import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.32.1-test.2';

/**
 * Summary:
 * - Add column `position` to table `Resource`.
 * - Add index `ResourcePositionUniqueIndex` to table `Resource`.
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Add column `position` to table `Resource`');
  await queryInterface.addColumn(
    'Resource',
    'position',
    {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    { transaction },
  );
  logger.info('Add unique index `ResourcePositionUniqueIndex` to table `Resource`');
  await queryInterface.addIndex('Resource', {
    name: 'ResourcePositionUniqueIndex',
    unique: true,
    fields: ['position', 'AppId', 'type'],
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
  await queryInterface.removeIndex('Resource', 'ResourcePositionUniqueIndex', { transaction });
  await queryInterface.removeColumn('Resource', 'position', { transaction });
}

import { logger } from '@appsemble/node-utils';
import { type Sequelize, type Transaction } from 'sequelize';

export const key = '0.32.1-test.16';

/**
 * Summary:
 * - Remove unique index `ResourcePositionUniqueIndex` from table `Resource`
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Removing unique index `ResourcePositionUniqueIndex` from table `Resource`');
  await queryInterface.removeIndex('Resource', 'ResourcePositionUniqueIndex', { transaction });
}

/**
 * Summary:
 * - Add unique index `ResourcePositionUniqueIndex` to table `Resource`
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding unique index `ResourcePositionUniqueIndex` to table `Resource`');
  await queryInterface.addIndex('Resource', {
    name: 'ResourcePositionUniqueIndex',
    unique: true,
    fields: ['Position', 'AppId', 'type'],
    transaction,
  });
}

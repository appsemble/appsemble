import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.5-test.0';

/**
 * Summary:
 * - Change the datatype of column `endpoint` in table `AppSubscription` to TEXT.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Changing column `enabled` to type TEXT in table `AppSubscription`');
  await queryInterface.changeColumn(
    'AppSubscription',
    'endpoint',
    { type: DataTypes.TEXT, allowNull: false },
    { transaction },
  );
}

/**
 * Summary:
 * - Change the datatype of column `endpoint` in table `AppSubscription` to STRING.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Changing column `enabled` to type STRING in table `AppSubscription`');
  await queryInterface.changeColumn(
    'AppSubscription',
    'endpoint',
    { type: DataTypes.STRING, allowNull: false },
    { transaction },
  );
}

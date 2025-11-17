import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.35.21';

/**
 * Summary:
 * - Add column locale to table `Organization`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `locale` to table `Organization`');
  await queryInterface.addColumn(
    'Organization',
    'locale',
    {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'en',
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove column locale from table `Organization`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Remove column locale from `Organization` table');
  await queryInterface.removeColumn('Organization', 'locale', { transaction });
}

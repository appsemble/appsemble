import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.35.8';

/**
 * Summary:
 * - Remove column preferredPaymentProvider from table `Organization`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Remove column preferredPaymentProvider from `Organization` table');
  await queryInterface.removeColumn('Organization', 'preferredPaymentProvider', { transaction });

  logger.info('Removing type enum enum_Organization_preferredPaymentProvider');
  await queryInterface.sequelize.query('DROP TYPE "enum_Organization_preferredPaymentProvider";', {
    transaction,
  });
}

/**
 * Summary:
 * - Add column preferredPaymentProvider to table `Organization`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `preferredPaymentProvider` to table `Organization`');
  await queryInterface.addColumn(
    'Organization',
    'preferredPaymentProvider',
    {
      type: DataTypes.ENUM('stripe'),
      values: ['stripe'],
      defaultValue: 'stripe',
    },
    { transaction },
  );
}

import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.33.7';

/**
 * Summary:
 * - Change unique asset indexes to disregard deleted
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `StripeApiKey` to `App` table');
  await queryInterface.addColumn(
    'App',
    'stripeApiKey',
    {
      type: DataTypes.BLOB,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `StripeSecret` to `App` table');
  await queryInterface.addColumn(
    'App',
    'stripeSecret',
    {
      type: DataTypes.BLOB,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `CancelUrl` to `App` table');
  await queryInterface.addColumn(
    'App',
    'cancelUrl',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `SuccessUrl` to `App` table');
  await queryInterface.addColumn(
    'App',
    'successUrl',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Change unique asset indexes to take deleted into account
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column StripeApiKey from `App` table');
  await queryInterface.removeColumn('App', 'stripeApiKey', { transaction });

  logger.info('Remove column StripeSecret from `App` table');
  await queryInterface.removeColumn('App', 'stripeSecret', { transaction });

  logger.info('Remove column SuccessUrl from `App` table');
  await queryInterface.removeColumn('App', 'successUrl', { transaction });

  logger.info('Remove column CancelUrl from `App` table');
  await queryInterface.removeColumn('App', 'cancelUrl', { transaction });
}

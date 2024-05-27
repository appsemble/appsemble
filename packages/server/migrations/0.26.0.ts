import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.26.0';

/**
 * Summary:
 * - Add column `email` to table `OAuthAuthorization`
 * - Update column `accessToken` of `OAuthAuthorization` from type STRING to TEXT
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Adding column `email` to `OAuthAuthorization`');
  await queryInterface.addColumn(
    'OAuthAuthorization',
    'email',
    {
      type: DataTypes.STRING,
    },
    { transaction },
  );

  logger.warn('Changing column `accessToken` of `OAuthAuthorization` from type STRING to TEXT');
  await queryInterface.changeColumn(
    'OAuthAuthorization',
    'accessToken',
    { type: DataTypes.TEXT },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove column `email` from table `OAuthAuthorization`
 * - Reverting column `accessToken` of `OAuthAuthorization` to type STRING
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Removing column `email` from `OAuthAuthorization`');
  await queryInterface.removeColumn('OAuthAuthorization', 'email', { transaction });

  logger.warn('Reverting column `accessToken` of `OAuthAuthorization` to type STRING');
  await queryInterface.changeColumn(
    'OAuthAuthorization',
    'accessToken',
    {
      type: DataTypes.STRING,
    },
    { transaction },
  );
}

import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.27.8';

/**
 * Summary:
 * - Add column `index` to `AppScreenshot`
 * - Add column `language` to `AppScreenshot`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add new column `index` to table `AppScreenshot`');
  await queryInterface.addColumn(
    'AppScreenshot',
    'index',
    {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    { transaction },
  );

  logger.info('Add new column `language` to table `AppScreenshot`');
  await queryInterface.addColumn(
    'AppScreenshot',
    'language',
    {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'unspecified',
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove column `index` from `AppScreenshot`
 * - Remove column `language` from `AppScreenshot`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column `index` from table `AppScreenshot`');
  await queryInterface.removeColumn('AppScreenshot', 'index', { transaction });

  logger.info('Removing column `language` from table `AppScreenshot`');
  await queryInterface.removeColumn('AppScreenshot', 'language', { transaction });
}

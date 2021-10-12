import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.19.1';

/**
 * Summary:
 * - Add column `googleAnalyticsID` to `App`
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column `googleAnalyticsID` to `App`');
  await queryInterface.addColumn('App', 'googleAnalyticsID', {
    type: DataTypes.STRING,
  });
}

/**
 * Summary:
 * - Remove column `googleAnalyticsID` from `App`
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warning('Removing column `googleAnalyticsID` from `App`');
  await queryInterface.removeColumn('App', 'googleAnalyticsID');
}

import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.19.1';

/**
 * Summary:
 * - Add column `properties` to AppMember
 * - Add column `googleAnalyticsID` to `App`
 * - Add columns `picture` to AppMember
 * - Add column `locale` to AppMember
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column `googleAnalyticsID` to `App`');
  await queryInterface.addColumn('App', 'googleAnalyticsID', {
    type: DataTypes.STRING,
  });

  logger.info('Adding column `picture` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'picture', {
    type: DataTypes.BLOB,
  });

  logger.info('Adding column `properties` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'properties', {
    type: DataTypes.JSON,
  });

  logger.info('Adding column `locale` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'locale', {
    type: DataTypes.STRING,
  });
}

/**
 * Summary:
 * - Remove column `googleAnalyticsID` from `App`
 * - Remove column `properties` from AppMember
 * - Remove column `picture` from AppMember
 * - Remove column `locale` from AppMember
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Removing column `googleAnalyticsID` from `App`');
  await queryInterface.removeColumn('App', 'googleAnalyticsID');

  logger.info('Removing column `properties` from `AppMember`');
  await queryInterface.removeColumn('AppMember', 'properties');

  logger.info('Removing column `picture` from `AppMember`');
  await queryInterface.removeColumn('AppMember', 'picture');

  logger.info('Removing column `locale` from `AppMember`');
  await queryInterface.removeColumn('AppMember', 'locale');
}

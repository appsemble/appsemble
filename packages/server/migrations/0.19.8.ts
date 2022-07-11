import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.19.8';

/**
 * Summary:
 * - Add column `sentryDSN` to table `App`
 * - Add column `sentryEnvironment` to table `App`
 * - Add column `visibility` to `App`
 * - Remove column `private` from `App`
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding column `sentryDsn` to `App`');
  await queryInterface.addColumn('App', 'sentryDsn', {
    type: DataTypes.STRING,
  });

  logger.info('Adding column `sentryEnvironment` to `App`');
  await queryInterface.addColumn('App', 'sentryEnvironment', {
    type: DataTypes.STRING,
  });

  logger.info('Adding column `visibility` to `App');
  await queryInterface.addColumn('App', 'visibility', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'unlisted',
  });
  await db.query('UPDATE "App" SET visibility = \'public\' WHERE private = false');

  logger.warn('Removing column `private` from `App`');
  await queryInterface.removeColumn('App', 'private');

  logger.info('Adding column `showAppDefinition` to `App');
  await queryInterface.addColumn('App', 'showAppDefinition', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
}

/**
 * Summary:
 * - Remove column `sentryDSN` from table `App`
 * - Remove column `sentryEnvironment` from table `App`
 * - Add column `private` to `App`
 * - Remove column `visibility` from `App`
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.warn('Removing column `showAppDefinition` from `App`');
  await queryInterface.removeColumn('App', 'showAppDefinition');

  logger.warn('Removing column `sentryDsn` from `App`');
  await queryInterface.removeColumn('App', 'sentryDsn');

  logger.warn('Removing column `sentryEnvironment` from `App`');
  await queryInterface.removeColumn('App', 'sentryEnvironment');

  logger.info('Adding column `private` to `App');
  await queryInterface.addColumn('App', 'private', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await db.query('UPDATE "App" SET private = true WHERE visibility != \'public\'');

  logger.info('Removing column `visibility` from `App`');
  await queryInterface.removeColumn('App', 'visibility');
}

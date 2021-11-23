import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.19.8';

/**
 * Summary:
 * - Add sentryDSN field to table App
 * - Add column `visibility` to `App`
 * - Remove column `private` from `App`
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding column `sentryDsn` to `App`');
  await queryInterface.addColumn('App', 'sentryDsn', {
    type: DataTypes.STRING,
  });

  logger.info('Adding column `visibility` to `App');
  await queryInterface.addColumn('App', 'visibility', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'unlisted',
  });
  await db.query('UPDATE "App" SET visibility = \'public\' WHERE private = false');

  logger.info('Removing column `private` from `App`');
  await queryInterface.removeColumn('App', 'private');
}

/**
 * Summary:
 * - Remove sentryDSN field to table App
 * - Add column `private` to `App`
 * - Remove column `visibility` from `App`
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.warning('Removing column `sentryDsn` from `App`');
  await queryInterface.removeColumn('App', 'sentryDsn');

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

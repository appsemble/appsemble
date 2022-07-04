import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.20.10';

/**
 * Summary:
 * - Add columns `emailHost`, `emailUser`,
 * `emailPassword`, `emailPort`, and `emailSecure` to table `App`
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding column `emailHost` to `App`');
  await queryInterface.addColumn('App', 'emailHost', {
    type: DataTypes.STRING,
  });

  logger.info('Adding column `emailUser` to `App`');
  await queryInterface.addColumn('App', 'emailUser', {
    type: DataTypes.STRING,
  });

  logger.info('Adding column `emailPassword` to `App`');
  await queryInterface.addColumn('App', 'emailPassword', {
    type: DataTypes.BLOB,
  });

  logger.info('Adding column `emailPort` to `App`');
  await queryInterface.addColumn('App', 'emailPort', {
    type: DataTypes.INTEGER,
    defaultValue: 587,
  });

  logger.info('Adding column `emailSecure` to `App`');
  await queryInterface.addColumn('App', 'emailSecure', {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  });

  logger.info('Adding column `BlockVersion`.`examples`');
  await queryInterface.addColumn('BlockVersion', 'examples', { type: DataTypes.JSONB });
}

/**
 * Summary:
 * - Remove columns `emailHost`, `emailUser`,
 * `emailPassword`, `emailPort`, and `emailSecure` from table `App`
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column `BlockVersion`.`examples`');
  await queryInterface.removeColumn('BlockVersion', 'examples');

  logger.warn('Removing column `emailHost` from `App`');
  await queryInterface.removeColumn('App', 'emailHost');

  logger.warn('Removing column `emailPort` from `App`');
  await queryInterface.removeColumn('App', 'emailPort');

  logger.warn('Removing column `emailUser` from `App`');
  await queryInterface.removeColumn('App', 'emailUser');

  logger.warn('Removing column `emailPassword` from `App`');
  await queryInterface.removeColumn('App', 'emailPassword');

  logger.warn('Removing column `emailSecure` from `App`');
  await queryInterface.removeColumn('App', 'emailSecure');
}

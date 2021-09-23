import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.18.31';

/**
 * Summary:
 * - Add columns `consent`, `password`, `emailKey`, and `resetKey` to AppMember
 * - Adds column `
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column `password` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'password', {
    type: DataTypes.STRING,
  });

  logger.info('Adding column `emailKey` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'emailKey', {
    type: DataTypes.STRING,
  });
  logger.info('Adding column `resetKey` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'resetKey', {
    type: DataTypes.STRING,
  });

  logger.info('Adding unique index between columns `AppId` and `email` for `AppMember`');
  await queryInterface.addConstraint('AppMember', {
    name: 'UniqueAppMemberEmailIndex',
    fields: ['AppId', 'email'],
    type: 'unique',
  });

  logger.info('Adding column `showAppsemblePasswordLogin` to `App`');
  await queryInterface.addColumn('App', 'showAppsemblePasswordLogin', {
    type: DataTypes.STRING,
    defaultValue: false,
  });
}

/**
 * Summary:
 * - Remove columns `password`, `resetKey`, and `emailKey` from AppMember
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column `password` from `AppMember`');
  await queryInterface.removeColumn('AppMember', 'password');

  logger.info('Removing column `resetKey` from `AppMember`');
  await queryInterface.removeColumn('AppMember', 'resetKey');

  logger.info('Removing column `emailKey` from `AppMember`');
  await queryInterface.removeColumn('AppMember', 'emailKey');
}

import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.20.46';

/**
 * Summary:
 * - Add column `scimEnabled` to `App`
 * - Add column `scimToken` to `App`
 * - Add column `scimExternalId` to `AppMember`
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column `scimEnabled` to `App`');
  await queryInterface.addColumn('App', 'scimEnabled', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });

  logger.info('Adding column `scimToken` to `App`');
  await queryInterface.addColumn('App', 'scimToken', { type: DataTypes.STRING });

  logger.info('Adding column `scimExternalId` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'scimExternalId', { type: DataTypes.STRING });

  logger.info('Adding column `scimEnabled` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'scimEnabled', { type: DataTypes.BOOLEAN });
}

/**
 * Summary:
 * - Remove columns `scimExternalId` from table `AppMember`
 * - Remove columns `scimToken` from table `App`
 * - Remove columns `scimEnabled` from table `App`
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Removing column `AppMember`.`scimExternalId`');
  await queryInterface.removeColumn('AppMember', 'scimExternalId');

  logger.warn('Removing column `App`.`scimToken`');
  await queryInterface.removeColumn('App', 'scimToken');

  logger.warn('Removing column `App`.`scimEnabled`');
  await queryInterface.removeColumn('App', 'scimEnabled');

  logger.info('Removing column `scimEnabled`.`AppMember`');
  await queryInterface.removeColumn('AppMember', 'scimEnabled');
}

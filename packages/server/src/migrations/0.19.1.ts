import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.19.1';

/**
 * Summary:
 * - Add columns `picture` to AppMember
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column `picture` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'picture', {
    type: DataTypes.BLOB,
  });
}

/**
 * Summary:
 * - Remove column `picture` from AppMember
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column `picture` from `AppMember`');
  await queryInterface.removeColumn('AppMember', 'picture');
}

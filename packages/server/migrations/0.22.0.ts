import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.22.0';

/**
 * Summary:
 * - Add column `subscribed` to table `User`
 * - Set `subscribed` property to `true` for non-deleted users
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Adding subscribed column to the users table');
  await queryInterface.addColumn('User', 'subscribed', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  });
  logger.warn('Setting SSO users to a subscribed state');
  await queryInterface.bulkUpdate('User', { subscribed: true }, { deleted: null });
}

/**
 * Summary:
 * - Remove column `subscribed` from table `User`
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Removing column `subscribed` from `User`');

  await queryInterface.removeColumn('User', 'subscribed');
}

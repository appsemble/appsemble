import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.20.12';

/**
 * Summary:
 * - Add column `timezone` to `User`
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column `timezone` to `User`');
  await queryInterface.addColumn('User', 'timezone', {
    type: DataTypes.STRING,
  });

  logger.info("Setting `User`.`timezone` to 'Europe/Amsterdam' for all users");
  await queryInterface.bulkUpdate('User', { timezone: 'Europe/Amsterdam' }, {});

  logger.info('Making column `User`.`timezone` required');
  await queryInterface.changeColumn('User', 'timezone', {
    type: DataTypes.STRING,
    allowNull: false,
  });
}

/**
 * Summary:
 * - Remove columns `timezone` from table `User`
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Removing column `User`.`timezone`');
  await queryInterface.removeColumn('User', 'timezone');
}

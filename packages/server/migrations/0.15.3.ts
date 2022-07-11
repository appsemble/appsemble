import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.15.3';

/**
 * Summary:
 * - Add the `locale` column to User
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding column locale to User');
  await queryInterface.addColumn('User', 'locale', {
    type: DataTypes.STRING,
  });
}

/**
 * Summary:
 * - Remove the `locale` column from User.
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.warn('Dropping column locale from User');
  await queryInterface.removeColumn('User', 'locale');
}

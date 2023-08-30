import { logger } from '@appsemble/node-utils';
import { type Sequelize } from 'sequelize';

export const key = '0.22.0';

/**
 * Summary:
 * - Update `"User".subscribed` column value to `false` where `password` and `deleted` are `null`
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn(
    'Setting `"User".subscribed` column value to `true` where `password` is null and `deleted` is null',
  );
  await queryInterface.bulkUpdate('User', { subscribed: false }, { password: null, deleted: null });
}

/**
 * Summary:
 * - Update `"User".subscribed` column value to `true` where `password` and `deleted` are `null`
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn(
    'Setting `"User".subscribed` column value to `false` where `password` is null and `deleted` is null',
  );
  await queryInterface.bulkUpdate('User', { subscribed: true }, { password: null, deleted: null });
}

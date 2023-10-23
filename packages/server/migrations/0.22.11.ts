import { logger } from '@appsemble/node-utils';
import { type Sequelize } from 'sequelize';

export const key = '0.22.11';

/**
 * Summary:
 * - Renames `AppServiceSecret`.`serviceName` to `AppServiceSecret`.`name`.
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Renaming column `AppServiceSecret`.`serviceName` to `AppServiceSecret`.`name`');
  await queryInterface.renameColumn('AppServiceSecret', 'serviceName', 'name');
}

export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Renaming column `AppServiceSecret`.`name` back to `AppServiceSecret`.`serviceName`');
  await queryInterface.renameColumn('AppServiceSecret', 'name', 'serviceName');
}

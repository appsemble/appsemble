import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.20.27';

/**
 * Summary:
 * - Add column `sslCertificate` to `App`
 * - Add column `sslKey` to `App`
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column `sslCertificate` to `App`');
  await queryInterface.addColumn('App', 'sslCertificate', { type: DataTypes.TEXT });

  logger.info('Adding column `sslKey` to `App`');
  await queryInterface.addColumn('App', 'sslKey', { type: DataTypes.TEXT });
}

/**
 * Summary:
 * - Remove columns `sslKey` from table `App`
 * - Remove columns `sslCertificate` from table `App`
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Removing column `App`.`sslKey`');
  await queryInterface.removeColumn('App', 'sslKey');

  logger.warn('Removing column `App`.`sslCertificate`');
  await queryInterface.removeColumn('App', 'sslCertificate');
}

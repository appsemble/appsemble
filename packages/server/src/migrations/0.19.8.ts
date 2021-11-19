import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.19.8';

/**
 * Summary:
 * - Add sentryDSN field to table App
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding column table');
  await queryInterface.addColumn('App', 'sentryDsn', {
    type: DataTypes.STRING,
  });
}

/**
 * Summary:
 * - Remove sentryDSN field to table App
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Deleting table Theme');
  await queryInterface.removeColumn('App', 'sentryDsn');
}

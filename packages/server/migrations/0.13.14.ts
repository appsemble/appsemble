import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.13.14';

/**
 * Summary:
 * - Add `expires` column to Resource
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.warn('Adding column expires in Resource');
  await queryInterface.addColumn('Resource', 'expires', { type: DataTypes.DATE });
}

export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.warn('Removing column expires in Resource');
  await queryInterface.removeColumn('Resource', 'expires');
}

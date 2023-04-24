import { logger } from '@appsemble/node-utils';
import { DataTypes, Op, type Sequelize } from 'sequelize';

export const key = '0.17.6';

/**
 * Summary:
 * - Add column App.locked
 * - Remove soft deleted assets.
 * - Remove column Asset.deleted
 * - Remove soft deleted resources.
 * - Remove column Resource.deleted
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column App.locked');
  await queryInterface.addColumn('App', 'locked', DataTypes.BOOLEAN);

  logger.warn('Deleting soft deleted assets');
  await queryInterface.bulkDelete('Asset', { deleted: { [Op.not]: null } });

  logger.warn('Deleting soft deleted resources');
  await queryInterface.bulkDelete('Resource', { deleted: { [Op.not]: null } });

  logger.info('Removing column Asset.deleted');
  await queryInterface.removeColumn('Asset', 'deleted');

  logger.info('Removing column Resource.deleted');
  await queryInterface.removeColumn('Resource', 'deleted');
}

/**
 * Summary:
 * - Remove column App.locked
 * - Add column Resource.deleted
 * - Add column Asset.deleted
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column App.locked');
  await queryInterface.removeColumn('App', 'locked');

  logger.info('Removing column Resource.deleted');
  await queryInterface.addColumn('Resource', 'deleted', { type: DataTypes.DATE });

  logger.info('Removing column Asset.deleted');
  await queryInterface.addColumn('Asset', 'deleted', { type: DataTypes.DATE });
}

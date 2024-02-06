import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.24.1';

/**
 * Summary:
 * - Add column Resource.seed
 * - Add column Resource.ephemeral
 * - Add column Asset.clonable
 * - Add column Asset.seed
 * - Add column Asset.ephemeral
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column Resource.seed');
  await queryInterface.addColumn('Resource', 'seed', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });

  logger.info('Adding column Resource.ephemeral');
  await queryInterface.addColumn('Resource', 'ephemeral', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });

  logger.info('Adding column Asset.seed');
  await queryInterface.addColumn('Asset', 'clonable', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });

  logger.info('Adding column Asset.seed');
  await queryInterface.addColumn('Asset', 'seed', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });

  logger.info('Adding column Asset.seed');
  await queryInterface.addColumn('Asset', 'ephemeral', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    unique: 'UniqueAssetNameIndex',
  });
}

/**
 * Summary:
 * - Remove column Resource.seed
 * - Remove column Resource.ephemeral
 * - Remove column Asset.clonable
 * - Remove column Asset.seed
 * - Remove column Asset.ephemeral
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing column Resource.seed');
  await queryInterface.removeColumn('Resource', 'seed');

  logger.info('Removing column Resource.ephemeral');
  await queryInterface.removeColumn('Resource', 'ephemeral');

  logger.info('Removing column Asset.clonable');
  await queryInterface.removeColumn('Asset', 'clonable');

  logger.info('Removing column Asset.seed');
  await queryInterface.removeColumn('Asset', 'seed');

  logger.info('Removing column Asset.ephemeral');
  await queryInterface.removeColumn('Asset', 'ephemeral');
}

import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.10';

/**
 * Summary:
 * - Add table `AppBuildSnapshot`
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add table `AppBuildSnapshot`');
  await queryInterface.createTable(
    'AppBuildSnapshot',
    {
      buildManifestJson: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      AppSnapshotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        references: { model: 'AppSnapshot', key: 'id' },
      },
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove table `AppBuildSnapshot`
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove table `AppBuildSnapshot`');
  await queryInterface.dropTable('AppBuildSnapshot', { transaction });
}

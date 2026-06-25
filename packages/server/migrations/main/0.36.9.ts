import { logger } from '@appsemble/node-utils';
import { type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.9';

/**
 * Summary:
 * - Add index `blockAssetBlockVersionFilenameIndex` to `BlockAsset` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add index `blockAssetBlockVersionFilenameIndex` to `BlockAsset` table');
  await queryInterface.addIndex('BlockAsset', ['BlockVersionId', 'filename'], {
    name: 'blockAssetBlockVersionFilenameIndex',
    transaction,
  });
}

/**
 * Summary:
 * - Remove index `blockAssetBlockVersionFilenameIndex` from `BlockAsset` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove index `blockAssetBlockVersionFilenameIndex` from `BlockAsset` table');
  await queryInterface.removeIndex('BlockAsset', 'blockAssetBlockVersionFilenameIndex', {
    transaction,
  });
}

import { logger } from '@appsemble/node-utils';
import { type Sequelize, type Transaction } from 'sequelize';

export const key = '0.34.5';

/**
 * Summary:
 * - Add index on BlockVersionId on BlockAsset
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add index on "BlockVersionId" to "BlockAsset" table');
  await queryInterface.addIndex('BlockAsset', ['BlockVersionId'], {
    name: 'BlockAssetBlockVersionId',
    transaction,
  });
}

/**
 * Summary:
 * - Remove index on BlockVersionId on BlockAsset
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove index on "BlockVersionId" from "BlockAsset" table');
  await queryInterface.removeIndex('BlockAsset', 'BlockAssetBlockVersionId', { transaction });
}

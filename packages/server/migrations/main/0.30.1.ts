import { logger } from '@appsemble/node-utils';
import { type Sequelize, type Transaction } from 'sequelize';

export const key = '0.30.1';

/**
 * Summary:
 * - Add index `resourceTypeComposite` to `Resource` table
 * - Add index `resourceDataIndex` to `Resource` table
 * - Add index `appCollectionComposite` to `AppCollection` table
 * - Add index `appMessagesComposite` to `AppMessages` table
 * - Add index `appDomainComposite` to `App` table
 * - Add index `assetAppIdIndex` to `Asset` table
 * - Add index `assetAppIdNameIndex` to `Asset` table
 * - Add index `assetNameIndex` to `Asset` table
 * - Add index `blockAssetFilenameIndex` to `BlockAsset` table
 * - Add index `appSnapshotComposite` to `AppSnapshot` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add index `resourceTypeComposite` to `Resource` table');
  await queryInterface.addIndex('Resource', {
    name: 'resourceTypeComposite',
    fields: ['AppId', 'type', 'GroupId', 'expires'],
    transaction,
  });

  logger.info('Add index `resourceDataIndex` to `Resource` table');
  await queryInterface.addIndex('Resource', {
    name: 'resourceDataIndex',
    fields: ['data'],
    using: 'GIN',
    transaction,
  });

  logger.info('Add index `appCollectionComposite` to `AppCollection` table');
  await queryInterface.addIndex('AppCollection', {
    name: 'appCollectionComposite',
    fields: ['domain', { name: 'updated', order: 'DESC' }],
    transaction,
  });

  logger.info('Add index `appMessagesComposite` to `AppMessages` table');
  await queryInterface.addIndex('AppMessages', {
    name: 'appMessagesComposite',
    fields: ['AppId', 'language'],
    transaction,
  });

  logger.info('Add index `appDomainComposite` to `App` table');
  await queryInterface.addIndex('App', {
    name: 'appDomainComposite',
    fields: ['deleted', 'domain'],
    transaction,
  });

  logger.info('Add index `assetAppIdIndex` to `Asset` table');
  await queryInterface.addIndex('Asset', {
    name: 'assetAppIdIndex',
    fields: ['AppId'],
    transaction,
  });

  logger.info('Add index `assetAppIdNameIndex` to `Asset` table');
  await queryInterface.addIndex('Asset', {
    name: 'assetAppIdNameIndex',
    fields: ['AppId', 'name'],
    transaction,
  });

  logger.info('Add index `assetNameIndex` to `Asset` table');
  await queryInterface.addIndex('Asset', {
    name: 'assetNameIndex',
    fields: ['name'],
    transaction,
  });

  logger.info('Add index `blockAssetFilenameIndex` to `BlockAsset` table');
  await queryInterface.addIndex('BlockAsset', {
    name: 'blockAssetFilenameIndex',
    fields: ['filename'],
    transaction,
  });

  logger.info('Add index `appSnapshotComposite` to `AppSnapshot` table');
  await queryInterface.addIndex('AppSnapshot', {
    name: 'appSnapshotComposite',
    fields: ['AppId', { name: 'created', order: 'DESC' }],
    transaction,
  });
}

/**
 * - Remove index `resourceTypeComposite` from `Resource` table
 * - Remove index `resourceDataIndex` from `Resource` table
 * - Remove index `appCollectionComposite` from `AppCollection` table
 * - Remove index `appMessagesComposite` from `AppMessages` table
 * - Remove index `appDomainComposite` from `App` table
 * - Remove index `assetAppIdIndex` from `Asset` table
 * - Remove index `assetAppIdNameIndex` from `Asset` table
 * - Remove index `assetNameIndex` from `Asset` table
 * - Remove index `blockAssetFilenameIndex` from `BlockAsset` table
 * - Remove index `appSnapshotComposite` from `AppSnapshot` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove index `resourceTypeComposite` from `Resource` table');
  await queryInterface.removeIndex('Resource', 'resourceTypeComposite', { transaction });

  logger.info('Remove index `resourceTypeComposite` from `Resource` table');
  await queryInterface.removeIndex('Resource', 'resourceDataIndex', { transaction });

  logger.info('Remove index `appCollectionComposite` from `AppCollection` table');
  await queryInterface.removeIndex('AppCollection', 'appCollectionComposite', { transaction });

  logger.info('Remove index `appMessagesComposite` from `AppMessages` table');
  await queryInterface.removeIndex('AppMessages', 'appMessagesComposite', { transaction });

  logger.info('Remove index `appDomainComposite` from `App` table');
  await queryInterface.removeIndex('App', 'appDomainComposite', { transaction });

  logger.info('Remove index `assetAppIdIndex` from `Asset` table');
  await queryInterface.removeIndex('Asset', 'assetAppIdIndex', { transaction });

  logger.info('Remove index `assetAppIdNameIndex` from `Asset` table');
  await queryInterface.removeIndex('Asset', 'assetAppIdNameIndex', { transaction });

  logger.info('Remove index `assetNameIndex` from `Asset` table');
  await queryInterface.removeIndex('Asset', 'assetNameIndex', { transaction });

  logger.info('Remove index `blockAssetFilenameIndex` from `BlockAsset` table');
  await queryInterface.removeIndex('BlockAsset', 'blockAssetFilenameIndex', { transaction });

  logger.info('Remove index `appSnapshotComposite` from `AppSnapshot` table');
  await queryInterface.removeIndex('AppSnapshot', 'appSnapshotComposite', { transaction });
}

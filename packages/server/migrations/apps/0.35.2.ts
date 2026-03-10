import { logger } from '@appsemble/node-utils';
import { Op, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.35.2';

/**
 * Summary:
 * - Change unique asset indexes to disregard deleted
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove index `UniqueAssetWithGroupId` from `Asset` table');
  await queryInterface.removeIndex('Asset', 'UniqueAssetWithGroupId', { transaction });

  logger.info('Remove index `UniqueAssetWithNullGroupId` from `Asset` table');
  await queryInterface.removeIndex('Asset', 'UniqueAssetWithNullGroupId', { transaction });

  logger.info('Add index `UniqueAssetWithGroupId` to `Asset` table');
  await queryInterface.addIndex('Asset', ['name', 'ephemeral', 'GroupId'], {
    name: 'UniqueAssetWithGroupId',
    unique: true,
    where: { GroupId: { [Op.not]: null }, deleted: null },
    transaction,
  });

  logger.info('Add index `UniqueAssetWithNullGroupId` to `Asset` table');
  await queryInterface.addIndex('Asset', ['name', 'ephemeral'], {
    name: 'UniqueAssetWithNullGroupId',
    unique: true,
    where: { GroupId: null, deleted: null },
    transaction,
  });
}

/**
 * Summary:
 * - Change unique asset indexes to take deleted into account
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove index `UniqueAssetWithGroupId` from `Asset` table');
  await queryInterface.removeIndex('Asset', 'UniqueAssetWithGroupId', { transaction });

  logger.info('Remove index `UniqueAssetWithNullGroupId` from `Asset` table');
  await queryInterface.removeIndex('Asset', 'UniqueAssetWithNullGroupId', { transaction });

  logger.info('Add index `UniqueAssetWithGroupId` to `Asset` table');
  await queryInterface.addIndex('Asset', ['name', 'ephemeral', 'GroupId'], {
    name: 'UniqueAssetWithGroupId',
    unique: true,
    where: { GroupId: { [Op.not]: null } },
    transaction,
  });

  logger.info('Add index `UniqueAssetWithNullGroupId` to `Asset` table');
  await queryInterface.addIndex('Asset', ['name', 'ephemeral'], {
    name: 'UniqueAssetWithNullGroupId',
    unique: true,
    where: { GroupId: null },
    transaction,
  });
}

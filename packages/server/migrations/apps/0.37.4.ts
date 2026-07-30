import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.37.4';

/**
 * Summary:
 * - Add refresh token rotation replay metadata to app member refresh sessions.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding `AppMemberRefreshSession.tokenId`');
  await queryInterface.addColumn(
    'AppMemberRefreshSession',
    'tokenId',
    { type: DataTypes.UUID },
    { transaction },
  );

  logger.info('Adding `AppMemberRefreshSession.tokenIssuedAt`');
  await queryInterface.addColumn(
    'AppMemberRefreshSession',
    'tokenIssuedAt',
    { type: DataTypes.DATE },
    { transaction },
  );

  logger.info('Adding `AppMemberRefreshSession.previousTokenHash`');
  await queryInterface.addColumn(
    'AppMemberRefreshSession',
    'previousTokenHash',
    { type: DataTypes.STRING(64) },
    { transaction },
  );

  logger.info('Adding `AppMemberRefreshSession.previousTokenExpires`');
  await queryInterface.addColumn(
    'AppMemberRefreshSession',
    'previousTokenExpires',
    { type: DataTypes.DATE },
    { transaction },
  );

  await queryInterface.addIndex('AppMemberRefreshSession', ['previousTokenHash'], { transaction });
}

/**
 * Summary:
 * - Remove refresh token rotation replay metadata from app member refresh sessions.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Dropping `AppMemberRefreshSession.previousTokenHash` index');
  await queryInterface.removeIndex('AppMemberRefreshSession', ['previousTokenHash'], {
    transaction,
  });

  logger.info('Dropping `AppMemberRefreshSession.previousTokenExpires`');
  await queryInterface.removeColumn('AppMemberRefreshSession', 'previousTokenExpires', {
    transaction,
  });

  logger.info('Dropping `AppMemberRefreshSession.previousTokenHash`');
  await queryInterface.removeColumn('AppMemberRefreshSession', 'previousTokenHash', {
    transaction,
  });

  logger.info('Dropping `AppMemberRefreshSession.tokenIssuedAt`');
  await queryInterface.removeColumn('AppMemberRefreshSession', 'tokenIssuedAt', { transaction });

  logger.info('Dropping `AppMemberRefreshSession.tokenId`');
  await queryInterface.removeColumn('AppMemberRefreshSession', 'tokenId', { transaction });
}

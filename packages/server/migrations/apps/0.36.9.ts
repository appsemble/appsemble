import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.9';

/**
 * Summary:
 * - Add `AppMemberRefreshSession` table for stateful app member refresh sessions.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding `AppMemberRefreshSession` table');
  await queryInterface.createTable(
    'AppMemberRefreshSession',
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sub: { type: DataTypes.UUID, allowNull: false },
      aud: { type: DataTypes.STRING, allowNull: false },
      scope: { type: DataTypes.STRING, allowNull: true },
      tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      expires: { type: DataTypes.DATE, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  await queryInterface.addIndex('AppMemberRefreshSession', ['sub'], { transaction });
  await queryInterface.addIndex('AppMemberRefreshSession', ['expires'], { transaction });
}

/**
 * Summary:
 * - Remove `AppMemberRefreshSession` table.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing `AppMemberRefreshSession` table');
  await queryInterface.dropTable('AppMemberRefreshSession', { transaction });
}

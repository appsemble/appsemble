import { logger } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.30.14-test.3';

/**
 * Summary:
 * - Delete all AppSubscription instances
 * - Remove column `UserId` from `AppSubscription` table
 * - Add column `AppMemberId` to `AppSubscription` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Delete all `AppSubscription` instances');
  await queryInterface.sequelize.query(
    `
    DELETE FROM "AppSubscription";
  `,
    {
      type: QueryTypes.DELETE,
      transaction,
    },
  );

  logger.info('Add column `AppMemberId` to `AppSubscription` table');
  await queryInterface.addColumn(
    'AppSubscription',
    'AppMemberId',
    {
      type: DataTypes.UUID,
      allowNull: true,
      onUpdate: 'cascade',
      onDelete: 'set null',
      references: {
        key: 'id',
        model: 'AppMember',
      },
    },
    { transaction },
  );

  logger.info('Remove column `UserId` on `AppSubscription` table');
  await queryInterface.removeColumn('AppSubscription', 'UserId', { transaction });
}

/**
 * Summary:
 * - Remove column `AppMemberId` from `AppSubscription` table
 * - Add column `UserId` to `AppSubscription` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `UserId` to `AppSubscription` table');
  await queryInterface.addColumn(
    'AppSubscription',
    'UserId',
    {
      type: DataTypes.UUID,
      allowNull: true,
      onUpdate: 'cascade',
      onDelete: 'set null',
      references: {
        key: 'id',
        model: 'User',
      },
    },
    { transaction },
  );

  logger.info('Remove column `AppMemberId` on `AppSubscription` table');
  await queryInterface.removeColumn('AppSubscription', 'AppMemberId', { transaction });
}

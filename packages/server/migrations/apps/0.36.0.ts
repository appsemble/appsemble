import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.0';

/**
 * Summary:
 * - Create new table `AppMemberEmailAuthorization`.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Creating new table `AppMemberEmailAuthorization`');
  await queryInterface.createTable(
    'AppMemberEmailAuthorization',
    {
      email: { type: DataTypes.STRING, allowNull: false },
      AppMemberId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'AppMember',
          key: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
        primaryKey: true,
      },
      verified: { allowNull: false, type: DataTypes.BOOLEAN, defaultValue: false },
      key: { type: DataTypes.STRING },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Drop table `AppMemberEmailAuthorization`.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Dropping table `AppMemberEmailAuthorization`');
  await queryInterface.dropTable('AppMemberEmailAuthorization', { transaction });
}

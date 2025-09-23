import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.30.4';

/**
 * Summary:
 * - Remove default value of `role` column in `GroupMember` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove default value of `role` column in `GroupMember` table');
  await queryInterface.changeColumn(
    'GroupMember',
    'role',
    {
      allowNull: false,
      type: DataTypes.STRING,
    },
    { transaction },
  );
}

/**
 * - Update default value of `role` column in `GroupMember` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Update default value of `role` column in `GroupMember` table');
  await queryInterface.changeColumn(
    'GroupMember',
    'role',
    {
      allowNull: false,
      defaultValue: 'Member',
      type: DataTypes.STRING,
    },
    { transaction },
  );
}

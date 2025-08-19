import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.34.11';

/**
 * Summary:
 * - Add column `phoneNumber` to `AppMember` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `phoneNumber` to `AppMember` table');
  await queryInterface.addColumn(
    'AppMember',
    'phoneNumber',
    { type: DataTypes.STRING, allowNull: true },
    { transaction },
  );

  logger.info('Add unique index `UniqueAppMemberPhoneNumberIndex` to table `AppMember`');
  await queryInterface.addIndex('AppMember', ['AppId', 'phoneNumber'], {
    unique: true,
    name: 'UniqueAppMemberPhoneNumberIndex',
    transaction,
  });
}

/**
 * Summary:
 * - Remove column `phoneNumber` from `AppMember` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove index `UniqueAppMemberPhoneNumberIndex` from table `AppMember`');
  queryInterface.removeIndex('AppMember', 'UniqueAppMemberPhoneNumberIndex', { transaction });

  logger.info('Remove column `phoneNumber` from `AppMember` table');
  await queryInterface.removeColumn('AppMember', 'phoneNumber', { transaction });
}

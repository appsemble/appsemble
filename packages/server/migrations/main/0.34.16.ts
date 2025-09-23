import { logger } from '@appsemble/node-utils';
import { DataTypes, Op, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.34.16';

/**
 * Summary:
 * - Add column `seed` to `AppMember` table
 * - Add column `ephemeral` to `AppMember` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `seed` to `AppMember` table');
  await queryInterface.addColumn(
    'AppMember',
    'seed',
    {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    { transaction },
  );

  logger.info('Add column `ephemeral` to `AppMember` table');
  await queryInterface.addColumn(
    'AppMember',
    'ephemeral',
    {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    { transaction },
  );

  logger.info('Remove index `UniqueAppMemberEmailIndex` from table `AppMember`');
  await queryInterface.removeIndex('AppMember', 'UniqueAppMemberEmailIndex', { transaction });

  logger.info('Add index `UniqueAppMemberEmailIndex` to table `AppMember`');
  await queryInterface.addIndex('AppMember', ['AppId', 'email', 'ephemeral'], {
    name: 'UniqueAppMemberEmailIndex',
    unique: true,
    transaction,
  });
}

/**
 * Summary:
 * - Remove column `seed` from `AppMember` table
 * - Remove column `ephemeral` from `AppMember` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Deleting ephemeral app members');
  await queryInterface.bulkDelete('AppMember', { [Op.and]: { demo: true, ephemeral: true } });

  logger.info('Remove column `seed` from table `AppMember`');
  await queryInterface.removeColumn('AppMember', 'seed', { transaction });

  logger.info('Remove column `ephemeral` from table `AppMember`');
  await queryInterface.removeColumn('AppMember', 'ephemeral', { transaction });

  logger.info('Remove index `UniqueAppMemberEmailIndex` from table `AppMember`');
  await queryInterface.removeIndex('AppMember', 'UniqueAppMemberEmailIndex', { transaction });

  logger.info('Add index `UniqueAppMemberEmailIndex` to table `AppMember`');
  await queryInterface.addIndex('AppMember', ['AppId', 'email'], {
    name: 'UniqueAppMemberEmailIndex',
    unique: true,
    transaction,
  });
}

import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.32.1-test.14';

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding column `public` to table `AppServiceSecret`');

  await queryInterface.addColumn(
    'AppServiceSecret',
    'public',
    {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    { transaction },
  );
}

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Removing column `public` from table `AppServiceSecret`');
  await queryInterface.removeColumn('AppServiceSecret', 'public', { transaction });
}

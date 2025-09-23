import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.32.3-test.2';

/**
 * Summary:
 * - Add column `skipGroupInvites` to `App` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `skipGroupInvites` to `App` table');
  await queryInterface.addColumn(
    'App',
    'skipGroupInvites',
    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove column `skipGroupInvites` from `App` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `skipGroupInvites` from `App` table');
  await queryInterface.removeColumn('App', 'skipGroupInvites', { transaction });
}

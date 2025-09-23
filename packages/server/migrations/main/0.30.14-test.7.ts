import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.30.14-test.7';

/**
 * Summary:
 * - Add column `deleted` to `Resource` table
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `deleted` to `Resource` table');
  await queryInterface.addColumn(
    'Resource',
    'deleted',
    {
      type: DataTypes.DATE,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `deleted` to `Asset` table');
  await queryInterface.addColumn(
    'Asset',
    'deleted',
    {
      type: DataTypes.DATE,
      allowNull: true,
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove column `deleted` from `Resource` table
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `deleted` from `Resource` table');
  await queryInterface.removeColumn('Resource', 'deleted', { transaction });

  logger.info('Remove column `deleted` from `Resource` table');
  await queryInterface.removeColumn('Asset', 'deleted', { transaction });
}

import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.5-test.6';

/**
 * Summary:
 * - Add column manifestJson to table `BlockVersion`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `manifestJson` to table `BlockVersion`');
  await queryInterface.addColumn(
    'BlockVersion',
    'manifestJson',
    {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove column manifestJson from table `BlockVersion`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Remove column `manifestJson` from `BlockVersion` table');
  await queryInterface.removeColumn('BlockVersion', 'manifestJson', { transaction });
}

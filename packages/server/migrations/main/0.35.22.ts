import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.35.22';

/**
 * Summary:
 * - Add column disabled to table `EmailAuthorization`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `disabled` to table `EmailAuthorization`');
  await queryInterface.addColumn(
    'EmailAuthorization',
    'disabled',
    {
      type: DataTypes.DATE,
      allowNull: true,
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove column disabled from table `EmailAuthorization`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Remove column disabled from `EmailAuthorization` table');
  await queryInterface.removeColumn('EmailAuthorization', 'disabled', { transaction });
}

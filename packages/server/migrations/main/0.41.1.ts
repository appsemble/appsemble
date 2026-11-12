import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.41.1';

/**
 * Summary:
 * - Add column `s3Bucket` to table `App`
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `s3Bucket` to table `App`');
  await queryInterface.addColumn('App', 's3Bucket', { type: DataTypes.STRING }, { transaction });
}

/**
 * Summary:
 * - Remove column `s3Bucket` from table `App`
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `s3Bucket` from table `App`');
  await queryInterface.removeColumn('App', 's3Bucket', { transaction });
}

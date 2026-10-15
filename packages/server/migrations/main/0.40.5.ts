import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.40.5';

/**
 * Summary:
 * - Add columns `displayFontFamily` and `displayFontSource` to table `Theme`
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `displayFontFamily` to table `Theme`');
  await queryInterface.addColumn(
    'Theme',
    'displayFontFamily',
    { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    { transaction },
  );

  logger.info('Add column `displayFontSource` to table `Theme`');
  await queryInterface.addColumn(
    'Theme',
    'displayFontSource',
    { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove columns `displayFontFamily` and `displayFontSource` from table `Theme`
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `displayFontFamily` from table `Theme`');
  await queryInterface.removeColumn('Theme', 'displayFontFamily', { transaction });

  logger.info('Remove column `displayFontSource` from table `Theme`');
  await queryInterface.removeColumn('Theme', 'displayFontSource', { transaction });
}

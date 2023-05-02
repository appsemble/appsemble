import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.19.6';

/**
 * Summary:
 * - Add Theme table
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Creating Theme table');
  await queryInterface.createTable('Theme', {
    // ID is not actually used in the model, but Sequelize expects a table to have a PK.
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bulmaVersion: { type: DataTypes.STRING, allowNull: false },
    primaryColor: { type: DataTypes.STRING, allowNull: false },
    linkColor: { type: DataTypes.STRING, allowNull: false },
    successColor: { type: DataTypes.STRING, allowNull: false },
    infoColor: { type: DataTypes.STRING, allowNull: false },
    warningColor: { type: DataTypes.STRING, allowNull: false },
    dangerColor: { type: DataTypes.STRING, allowNull: false },
    themeColor: { type: DataTypes.STRING, allowNull: false },
    splashColor: { type: DataTypes.STRING, allowNull: false },
    fontFamily: { type: DataTypes.STRING, allowNull: false },
    fontSource: { type: DataTypes.STRING, allowNull: false },
    css: { type: DataTypes.TEXT, allowNull: false },
    created: { type: DataTypes.DATE, allowNull: false },
  });
}

/**
 * Summary:
 * - Remove Theme table
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Deleting table Theme');
  await queryInterface.dropTable('Theme');
}

import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.13.9';

/**
 * Summary:
 * - Add the AppScreenshot table.
 *
 * @param db - The sequelize Database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding new table AppScreenshot');
  await queryInterface.createTable('AppScreenshot', {
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: {
        key: 'id',
        model: 'App',
      },
    },
    id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
    screenshot: { type: DataTypes.BLOB, allowNull: false },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });
}

/**
 * Summary:
 * - Remove the AppScreenshot table.
 *
 * @param db - The sequelize Database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.warn('Dropping table AppScreenshot');
  await queryInterface.dropTable('AppScreenshot');
}

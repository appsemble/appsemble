import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.15.2';

/**
<<<<<<< HEAD
 * Summary:
 * - Add the `locale` column to User
 * - Add the `OAuth2Consent` table.
 *
 * @param db - The sequelize Database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding column locale to User');
  await queryInterface.addColumn('User', 'locale', {
    type: DataTypes.STRING,
  });

  logger.info('Adding table OAuth2Consent');
  await queryInterface.createTable('OAuth2Consent', {
    AppId: {
      type: DataTypes.INTEGER,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      allowNull: false,
      references: { model: 'App', key: 'id' },
    },
    UserId: {
      type: DataTypes.UUID,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      allowNull: false,
      references: { model: 'User', key: 'id' },
    },
    scope: { type: DataTypes.STRING, allowNull: false },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });
}

/**
 * Summary:
 * - Remove the AppScreenshot table.
 * - Drop the `OAuth2Consent` table.
 *
 * @param db - The sequelize Database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.warn('Dropping column locale from User');
  await queryInterface.removeColumn('User', 'locale');

  logger.info('Removing table OAuth2Consent');
  await queryInterface.dropTable('OAuth2Consent');
}

import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.15.2';

/**
 * Summary:
 * - Add the `OAuth2Consent` table.
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding table OAuth2Consent');
  await queryInterface.createTable('OAuth2Consent', {
    AppId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      allowNull: false,
      references: { model: 'App', key: 'id' },
    },
    UserId: {
      type: DataTypes.UUID,
      primaryKey: true,
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
 * - Drop the `OAuth2Consent` table.
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing table OAuth2Consent');
  await queryInterface.dropTable('OAuth2Consent');
}

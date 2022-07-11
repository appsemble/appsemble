import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.13.5';

/**
 * Summary:
 * - Add clonable field to resources
 * - Add the AppOAuth2Secret table.
 * - Add the AppOAuth2Authorization table.
 *
 * @param db The sequelize Database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding new table AppOAuth2Secret');
  await queryInterface.createTable('AppOAuth2Secret', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    authorizationUrl: { type: DataTypes.STRING, allowNull: false },
    tokenUrl: { type: DataTypes.STRING, allowNull: false },
    userInfoUrl: { type: DataTypes.STRING },
    remapper: { type: DataTypes.JSON },
    clientId: { type: DataTypes.STRING, allowNull: false },
    clientSecret: { type: DataTypes.STRING, allowNull: false },
    icon: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    scope: { type: DataTypes.STRING, allowNull: false },
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
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });

  logger.info('Adding new table AppOAuth2Authorization');
  await queryInterface.createTable('AppOAuth2Authorization', {
    sub: { type: DataTypes.STRING, primaryKey: true },
    AppOAuth2SecretId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      onUpdate: 'cascade',
      references: { key: 'id', model: 'AppOAuth2Secret' },
    },
    accessToken: { type: DataTypes.TEXT, allowNull: false },
    expiresAt: { type: DataTypes.DATE },
    refreshToken: { type: DataTypes.TEXT },
    UserId: {
      type: DataTypes.UUID,
      allowNull: false,
      onUpdate: 'cascade',
      references: { key: 'id', model: 'User' },
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });

  logger.info('Adding clonable column to Resource');
  await queryInterface.addColumn('Resource', 'clonable', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.warn('Dropping table AppOAuth2Authorization');
  await queryInterface.dropTable('AppOAuth2Authorization');

  logger.warn('Dropping table AppOAuth2Secret');
  await queryInterface.dropTable('AppOAuth2Secret');

  logger.warn('Removing clonable column from Resource');
  await queryInterface.removeColumn('Resource', 'clonable');
}

import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.15.8';

/**
 * Summary:
 * - Create table `AppSamlSecret`
 * - Create table `SamlLoginRequest`
 * - Create table `AppSamlAuthorization`
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Creating table to AppSamlSecret');
  await queryInterface.createTable('AppSamlSecret', {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      autoIncrement: true,
    },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: { key: 'id', model: 'App' },
    },
    name: { type: DataTypes.TEXT, allowNull: false },
    idpCertificate: { type: DataTypes.TEXT, allowNull: false },
    entityId: { type: DataTypes.STRING, allowNull: false },
    ssoUrl: { type: DataTypes.STRING, allowNull: false },
    icon: { type: DataTypes.STRING, allowNull: false },
    spPrivateKey: { type: DataTypes.TEXT, allowNull: false },
    spPublicKey: { type: DataTypes.TEXT, allowNull: false },
    spCertificate: { type: DataTypes.TEXT, allowNull: false },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });

  logger.info('Creating table to SamlLoginRequest');
  await queryInterface.createTable('SamlLoginRequest', {
    id: { primaryKey: true, type: DataTypes.STRING },
    scope: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    redirectUri: { type: DataTypes.STRING, allowNull: false },
    AppSamlSecretId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: { key: 'id', model: 'AppSamlSecret' },
    },
    UserId: {
      type: DataTypes.UUID,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: { key: 'id', model: 'User' },
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });

  logger.info('Creating table to AppSamlAuthorization');
  await queryInterface.createTable('AppSamlAuthorization', {
    nameId: { type: DataTypes.STRING, primaryKey: true },
    AppSamlSecretId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: { key: 'id', model: 'AppSamlSecret' },
    },
    UserId: {
      type: DataTypes.UUID,
      allowNull: false,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: { key: 'id', model: 'User' },
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });
}

/**
 * Summary:
 * - Drop table `AppSamlAuthorization`
 * - Drop table `SamlLoginRequest`
 * - Drop table `AppSamlSecret`
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Deleting table AppSamlAuthorization');
  await queryInterface.dropTable('AppSamlAuthorization');

  logger.warn('Deleting table SamlLoginRequest');
  await queryInterface.dropTable('SamlLoginRequest');

  logger.warn('Deleting table AppSamlSecret');
  await queryInterface.dropTable('AppSamlSecret');
}

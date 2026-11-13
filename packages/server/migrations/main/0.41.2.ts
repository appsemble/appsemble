import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.41.2';

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Add organization single sign-on configuration and identities');
  await queryInterface.createTable(
    'OrganizationSso',
    {
      OrganizationId: {
        type: DataTypes.STRING,
        primaryKey: true,
        references: { model: 'Organization', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      issuer: { type: DataTypes.TEXT, allowNull: false },
      clientId: { type: DataTypes.STRING, allowNull: false },
      clientSecret: { type: DataTypes.BLOB, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      scope: { type: DataTypes.STRING, allowNull: false },
      groupClaim: { type: DataTypes.STRING, allowNull: false },
      roleMappings: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      policy: { type: DataTypes.STRING, allowNull: false },
      managedBy: { type: DataTypes.STRING, allowNull: false },
      allowedLoginMethods: { type: DataTypes.JSONB, allowNull: false },
      configurationUpdated: { type: DataTypes.DATE, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'OrganizationSsoIdentity',
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      UserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      issuer: { type: DataTypes.TEXT, allowNull: false },
      subject: { type: DataTypes.STRING, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.addIndex('OrganizationSsoIdentity', ['issuer', 'subject'], {
    name: 'OrganizationSsoIdentity_issuer_subject_key',
    unique: true,
    transaction,
  });
  await queryInterface.createTable(
    'OrganizationSsoSession',
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      OrganizationId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'Organization', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      OrganizationSsoIdentityId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'OrganizationSsoIdentity', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      accessToken: { type: DataTypes.BLOB, allowNull: false },
      refreshToken: { type: DataTypes.BLOB },
      refreshTokenHash: { type: DataTypes.STRING(64), allowNull: false },
      interactiveRevoked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      accessTokenExpires: { type: DataTypes.DATE, allowNull: false },
      expires: { type: DataTypes.DATE, allowNull: false },
      configurationUpdated: { type: DataTypes.DATE, allowNull: false },
      groups: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  logger.info('Separate manual and group-managed organization access');
  await queryInterface.addColumn(
    'OAuth2ClientCredentials',
    'loginMethod',
    { type: DataTypes.STRING },
    { transaction },
  );
  await queryInterface.addColumn(
    'OAuth2ClientCredentials',
    'OrganizationSsoSessionId',
    {
      type: DataTypes.UUID,
      references: { model: 'OrganizationSsoSession', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    { transaction },
  );
  await queryInterface.sequelize.query(
    'ALTER TABLE "OrganizationMember" ALTER COLUMN role DROP NOT NULL',
    { transaction },
  );
  await queryInterface.addColumn(
    'OrganizationMember',
    'ssoRoles',
    { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    { transaction },
  );
  await queryInterface.addColumn(
    'OrganizationMember',
    'guest',
    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    { transaction },
  );
  await queryInterface.addColumn(
    'OrganizationInvite',
    'guest',
    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    { transaction },
  );
}

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Remove organization single sign-on configuration and identities');
  await queryInterface.removeColumn('OAuth2ClientCredentials', 'OrganizationSsoSessionId', {
    transaction,
  });
  await queryInterface.removeColumn('OAuth2ClientCredentials', 'loginMethod', { transaction });
  await queryInterface.dropTable('OrganizationSsoSession', { transaction });
  await queryInterface.dropTable('OrganizationSsoIdentity', { transaction });
  await queryInterface.dropTable('OrganizationSso', { transaction });
  await queryInterface.removeColumn('OrganizationInvite', 'guest', { transaction });
  await queryInterface.removeColumn('OrganizationMember', 'guest', { transaction });
  await queryInterface.removeColumn('OrganizationMember', 'ssoRoles', { transaction });
  await db.query('DELETE FROM "OrganizationMember" WHERE role IS NULL', { transaction });
  await db.query('ALTER TABLE "OrganizationMember" ALTER COLUMN role SET NOT NULL', {
    transaction,
  });
}

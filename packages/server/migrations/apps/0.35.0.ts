import { logger } from '@appsemble/node-utils';
import { DataTypes, Op, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.35.0';

/*
 * Summary:
 * - Create all tables from production database snapshot from 0.34.16
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  const tables = await queryInterface.showAllTables();
  if (tables.some((name) => name !== 'Meta')) {
    logger.info('skipping migration because database is not empty');
    return;
  }

  logger.info('Creating tables from production database snapshot from 0.33.0');
  await queryInterface.createTable(
    'AppBlockStyle',
    {
      block: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      style: { type: DataTypes.TEXT },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppInvite',
    {
      email: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      key: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Member' },
      userId: { type: DataTypes.UUID },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
    },
    { transaction },
  );
  await queryInterface.addIndex('AppInvite', ['userId'], {
    name: 'AppInvite_UserId_key',
    unique: true,
    transaction,
  });
  await queryInterface.createTable(
    'AppMember',
    {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      role: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
      name: { type: DataTypes.STRING },
      password: { type: DataTypes.STRING },
      emailKey: { type: DataTypes.STRING },
      resetKey: { type: DataTypes.STRING },
      consent: { type: DataTypes.DATE },
      picture: { type: DataTypes.BLOB },
      properties: { type: DataTypes.JSON },
      scimExternalId: { type: DataTypes.STRING },
      scimActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      locale: { type: DataTypes.STRING },
      timezone: { type: DataTypes.STRING },
      demo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      userId: { type: DataTypes.UUID },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.addIndex('AppMember', ['email'], {
    name: 'UniqueAppMemberEmailIndex',
    unique: true,
    transaction,
  });
  await queryInterface.addIndex('AppMember', ['userId'], {
    name: 'UniqueAppMemberUserIndex',
    unique: true,
    transaction,
  });
  await queryInterface.createTable(
    'AppOAuth2Secret',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      authorizationUrl: { type: DataTypes.STRING, allowNull: false },
      tokenUrl: { type: DataTypes.STRING, allowNull: false },
      userInfoUrl: { type: DataTypes.STRING },
      remapper: { type: DataTypes.JSON },
      clientId: { type: DataTypes.STRING, allowNull: false },
      clientSecret: { type: DataTypes.STRING, allowNull: false },
      icon: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      scope: { type: DataTypes.STRING, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppOAuth2Authorization',
    {
      sub: { type: DataTypes.STRING, primaryKey: true },
      AppOAuth2SecretId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'AppOAuth2Secret', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      accessToken: { type: DataTypes.TEXT, allowNull: false },
      expiresAt: { type: DataTypes.DATE },
      refreshToken: { type: DataTypes.TEXT },
      email: { type: DataTypes.STRING, allowNull: false },
      emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppMemberId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppSamlSecret',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, primaryKey: true },
      idpCertificate: { type: DataTypes.TEXT, allowNull: false },
      entityId: { type: DataTypes.STRING, allowNull: false },
      ssoUrl: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      icon: { type: DataTypes.STRING, allowNull: false },
      spPrivateKey: { type: DataTypes.TEXT, allowNull: false },
      spPublicKey: { type: DataTypes.TEXT, allowNull: false },
      spCertificate: { type: DataTypes.TEXT, allowNull: false },
      emailAttribute: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      },
      emailVerifiedAttribute: { type: DataTypes.STRING },
      nameAttribute: { type: DataTypes.STRING },
      objectIdAttribute: { type: DataTypes.STRING },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppSamlAuthorization',
    {
      nameId: { type: DataTypes.STRING, primaryKey: true },
      email: { type: DataTypes.STRING, allowNull: false },
      emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      AppSamlSecretId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'AppSamlSecret', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppMemberId: {
        type: DataTypes.UUID,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppServiceSecret',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, primaryKey: true },
      name: { type: DataTypes.STRING },
      urlPatterns: { type: DataTypes.STRING, allowNull: false },
      authenticationMethod: { type: DataTypes.STRING, allowNull: false },
      public: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      identifier: { type: DataTypes.TEXT },
      secret: { type: DataTypes.BLOB },
      tokenUrl: { type: DataTypes.STRING },
      scope: { type: DataTypes.STRING },
      ca: { type: DataTypes.TEXT },
      accessToken: { type: DataTypes.BLOB },
      expiresAt: { type: DataTypes.DATE },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppSubscription',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      endpoint: { type: DataTypes.STRING, allowNull: false },
      p256dh: { type: DataTypes.STRING, allowNull: false },
      auth: { type: DataTypes.STRING, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppMemberId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppVariable',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      value: { type: DataTypes.STRING },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
    },
    { transaction },
  );
  await queryInterface.addIndex('AppVariable', ['name'], {
    name: 'UniqueNameIndex',
    unique: true,
    transaction,
  });
  await queryInterface.createTable(
    'AppWebhookSecret',
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      name: { type: DataTypes.STRING },
      webhookName: { type: DataTypes.STRING, allowNull: false },
      secret: { type: DataTypes.BLOB, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'Group',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      annotations: { type: DataTypes.JSON },
      demo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'Resource',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, primaryKey: true },
      type: { type: DataTypes.STRING, allowNull: false },
      data: { type: DataTypes.JSONB, allowNull: false },
      clonable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      seed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ephemeral: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      expires: { type: DataTypes.DATE },
      Position: { type: DataTypes.DECIMAL },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      deleted: { type: DataTypes.DATE },
      GroupId: {
        type: DataTypes.INTEGER,
        references: { model: 'Group', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      AuthorId: {
        type: DataTypes.UUID,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      EditorId: {
        type: DataTypes.UUID,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.addIndex('Resource', ['type', 'expires', 'GroupId'], {
    name: 'resourceTypeComposite',
    transaction,
  });
  await queryInterface.addIndex('Resource', ['data'], {
    name: 'resourceDataIndex',
    using: 'GIN',
    transaction,
  });
  await queryInterface.createTable(
    'Asset',
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      mime: { type: DataTypes.STRING },
      filename: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      clonable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      seed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ephemeral: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      deleted: { type: DataTypes.DATE },
      ResourceId: {
        type: DataTypes.INTEGER,
        references: { model: 'Resource', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      AppMemberId: {
        type: DataTypes.UUID,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      GroupId: {
        type: DataTypes.INTEGER,
        references: { model: 'Group', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.addIndex('Asset', ['name'], {
    name: 'assetNameIndex',
    transaction,
  });
  await queryInterface.addIndex('Asset', ['name', 'ephemeral', 'GroupId'], {
    name: 'UniqueAssetWithGroupId',
    unique: true,
    where: { GroupId: { [Op.not]: null } },
    transaction,
  });
  await queryInterface.addIndex('Asset', ['name', 'ephemeral'], {
    name: 'UniqueAssetWithNullGroupId',
    unique: true,
    where: { GroupId: null },
    transaction,
  });
  await queryInterface.createTable(
    'GroupInvite',
    {
      GroupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Group', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      email: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      key: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Member' },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'GroupMember',
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      role: { type: DataTypes.STRING, allowNull: false },
      GroupId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'Group', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppMemberId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'OAuth2AuthorizationCode',
    {
      code: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      redirectUri: { type: DataTypes.STRING, allowNull: false },
      expires: { type: DataTypes.DATE, allowNull: false },
      scope: { type: DataTypes.STRING, allowNull: false },
      AppMemberId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'ResourceSubscription',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      ResourceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Resource', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      action: { type: DataTypes.STRING },
      type: { type: DataTypes.STRING },
      AppSubscriptionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'AppSubscription', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'ResourceVersion',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4(),
      },
      data: { type: DataTypes.JSON },
      ResourceId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Resource', key: 'id' },
      },
      AppMemberId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        references: { model: 'AppMember', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'SamlLoginRequest',
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      scope: { type: DataTypes.STRING, allowNull: false },
      state: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING },
      nameId: { type: DataTypes.STRING },
      redirectUri: { type: DataTypes.STRING, allowNull: false },
      timezone: { type: DataTypes.STRING, allowNull: false },
      AppSamlSecretId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'AppSamlSecret', key: 'id' },
      },
      AppMemberId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'AppMember', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
}

/*
 * Summary:
 */
export function down(): void {
  logger.warn(`Down migration for ${key} not implemented!`);
}

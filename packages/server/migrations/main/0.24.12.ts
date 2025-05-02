import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.24.12';

/*
 * Summary:
 * - Create all tables from production database snapshot from 0.24.9
 * Should not run if tables other than Meta exist
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  const tables = await queryInterface.showAllTables();
  if (tables.some((name) => name !== 'Meta')) {
    logger.info('skipping migration because database is not empty');
    return;
  }

  logger.info('Creating tables from production database snapshot from 0.24.9');
  await queryInterface.createTable(
    'Training',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      difficultyLevel: { type: DataTypes.INTEGER, allowNull: true },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      competences: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'TrainingBlock',
    {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      TrainingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Training', key: 'id' },
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      documentationLink: { type: DataTypes.STRING(255), allowNull: true },
      videoLink: { type: DataTypes.STRING(255), allowNull: true },
      exampleCode: { type: DataTypes.TEXT, allowNull: true },
      externalResource: { type: DataTypes.STRING(255), allowNull: true },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'User',
    {
      name: { type: DataTypes.STRING(255), allowNull: true },
      password: { type: DataTypes.STRING(255), allowNull: true },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      deleted: { type: DataTypes.DATE, allowNull: true },
      primaryEmail: { type: DataTypes.STRING(255), allowNull: true },
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      locale: { type: DataTypes.STRING(255), allowNull: true },
      timezone: { type: DataTypes.STRING(255), allowNull: true },
      subscribed: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
      demoLoginUser: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'EmailAuthorization',
    {
      email: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      key: { type: DataTypes.STRING(255), allowNull: true },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      UserId: {
        onUpdate: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'User', key: 'id' },
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'OAuth2ClientCredentials',
    {
      id: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      description: { type: DataTypes.STRING(255), allowNull: false },
      secret: { type: DataTypes.STRING(255), allowNull: false },
      expires: { type: DataTypes.DATE, allowNull: true },
      scopes: { type: DataTypes.STRING(255), allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      UserId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'User', key: 'id' },
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'ResetPasswordToken',
    {
      token: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      UserId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'User', key: 'id' },
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'OAuthAuthorization',
    {
      sub: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      authorizationUrl: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      accessToken: { type: DataTypes.TEXT, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: true },
      refreshToken: { type: DataTypes.TEXT, allowNull: true },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      code: { type: DataTypes.TEXT, allowNull: true },
      UserId: {
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'User', key: 'id' },
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'UserTraining',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      UserId: { type: DataTypes.UUID, allowNull: false, references: { model: 'User', key: 'id' } },
      TrainingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Training', key: 'id' },
      },
      completed: { type: DataTypes.BOOLEAN, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'Theme',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      bulmaVersion: { type: DataTypes.STRING(255), allowNull: false },
      primaryColor: { type: DataTypes.STRING(255), allowNull: false },
      linkColor: { type: DataTypes.STRING(255), allowNull: false },
      successColor: { type: DataTypes.STRING(255), allowNull: false },
      infoColor: { type: DataTypes.STRING(255), allowNull: false },
      warningColor: { type: DataTypes.STRING(255), allowNull: false },
      dangerColor: { type: DataTypes.STRING(255), allowNull: false },
      themeColor: { type: DataTypes.STRING(255), allowNull: false },
      splashColor: { type: DataTypes.STRING(255), allowNull: false },
      fontFamily: { type: DataTypes.STRING(255), allowNull: false },
      fontSource: { type: DataTypes.STRING(255), allowNull: false },
      css: { type: DataTypes.TEXT, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'Organization',
    {
      id: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: true },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      deleted: { type: DataTypes.DATE, allowNull: true },
      icon: { type: DataTypes.BLOB, allowNull: true },
      description: { type: DataTypes.STRING(255), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      website: { type: DataTypes.STRING(255), allowNull: true },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppCollection',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      headerImage: { type: DataTypes.BLOB, allowNull: false },
      headerImageMimeType: { type: DataTypes.STRING(255), allowNull: false },
      expertName: { type: DataTypes.STRING(255), allowNull: false },
      expertDescription: { type: DataTypes.STRING(4000), allowNull: true },
      expertProfileImage: { type: DataTypes.BLOB, allowNull: false },
      expertProfileImageMimeType: { type: DataTypes.STRING(255), allowNull: false },
      OrganizationId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: { model: 'Organization', key: 'id' },
      },
      visibility: { type: DataTypes.STRING(255), allowNull: false },
      domain: { type: DataTypes.STRING(253), allowNull: true },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'App',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      definition: { type: DataTypes.JSON, allowNull: false },
      domain: { type: DataTypes.STRING(253), allowNull: true },
      icon: { type: DataTypes.BLOB, allowNull: true },
      path: { type: DataTypes.STRING(255), allowNull: true },
      coreStyle: { type: DataTypes.TEXT, allowNull: true },
      sharedStyle: { type: DataTypes.TEXT, allowNull: true },
      OrganizationId: {
        onUpdate: 'CASCADE',
        type: DataTypes.STRING(255),
        allowNull: false,
        references: { model: 'Organization', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      deleted: { type: DataTypes.DATE, allowNull: true },
      vapidPublicKey: { type: DataTypes.STRING(255), allowNull: false },
      vapidPrivateKey: { type: DataTypes.STRING(255), allowNull: false },
      template: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      longDescription: { type: DataTypes.TEXT, allowNull: true },
      maskableIcon: { type: DataTypes.BLOB, allowNull: true },
      iconBackground: { type: DataTypes.STRING(255), allowNull: true },
      locked: { type: DataTypes.BOOLEAN, allowNull: true },
      showAppsembleOAuth2Login: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
      showAppsembleLogin: { type: DataTypes.STRING(255), allowNull: true, defaultValue: 'false' },
      googleAnalyticsID: { type: DataTypes.STRING(255), allowNull: true },
      sentryDsn: { type: DataTypes.STRING(255), allowNull: true },
      sentryEnvironment: { type: DataTypes.STRING(255), allowNull: true },
      visibility: { type: DataTypes.STRING(255), allowNull: false, defaultValue: 'unlisted' },
      showAppDefinition: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      emailName: { type: DataTypes.STRING(255), allowNull: true },
      emailHost: { type: DataTypes.STRING(255), allowNull: true },
      emailUser: { type: DataTypes.STRING(255), allowNull: true },
      emailPassword: { type: DataTypes.BLOB, allowNull: true },
      emailPort: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 587 },
      emailSecure: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
      sslCertificate: { type: DataTypes.TEXT, allowNull: true },
      sslKey: { type: DataTypes.TEXT, allowNull: true },
      scimEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      scimToken: { type: DataTypes.BLOB, allowNull: true },
      demoMode: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      controllerCode: { type: DataTypes.TEXT, allowNull: true },
      controllerImplementations: { type: DataTypes.JSON, allowNull: true },
      enableSelfRegistration: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppCollectionApp',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      AppCollectionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'AppCollection', key: 'id' },
        onDelete: 'CASCADE',
      },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'App', key: 'id' },
      },
      pinnedAt: { type: DataTypes.DATE, allowNull: true },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppEmailQuotaLog',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      AppId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'App', key: 'id' } },
      created: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppMessages',
    {
      AppId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'App', key: 'id' },
      },
      language: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      messages: { type: DataTypes.JSON, allowNull: true },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppRating',
    {
      rating: { type: DataTypes.INTEGER, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      AppId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'App', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      UserId: {
        onUpdate: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'User', key: 'id' },
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppOAuth2Secret',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      authorizationUrl: { type: DataTypes.STRING(255), allowNull: false },
      tokenUrl: { type: DataTypes.STRING(255), allowNull: false },
      userInfoUrl: { type: DataTypes.STRING(255), allowNull: true },
      remapper: { type: DataTypes.JSON, allowNull: true },
      clientId: { type: DataTypes.STRING(255), allowNull: false },
      clientSecret: { type: DataTypes.STRING(255), allowNull: false },
      icon: { type: DataTypes.STRING(255), allowNull: false },
      name: { type: DataTypes.STRING(255), allowNull: false },
      scope: { type: DataTypes.STRING(255), allowNull: false },
      AppId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppScreenshot',
    {
      AppId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
      },
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      screenshot: { type: DataTypes.BLOB, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      name: { type: DataTypes.STRING(255), allowNull: true },
      width: { type: DataTypes.INTEGER, allowNull: false },
      height: { type: DataTypes.INTEGER, allowNull: false },
      mime: { type: DataTypes.STRING(255), allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppSamlSecret',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      AppId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
      },
      name: { type: DataTypes.TEXT, allowNull: false },
      idpCertificate: { type: DataTypes.TEXT, allowNull: false },
      entityId: { type: DataTypes.STRING(255), allowNull: false },
      ssoUrl: { type: DataTypes.STRING(255), allowNull: false },
      icon: { type: DataTypes.STRING(255), allowNull: false },
      spPrivateKey: { type: DataTypes.TEXT, allowNull: false },
      spPublicKey: { type: DataTypes.TEXT, allowNull: false },
      spCertificate: { type: DataTypes.TEXT, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      emailAttribute: { type: DataTypes.STRING(255), allowNull: true },
      nameAttribute: { type: DataTypes.STRING(255), allowNull: true },
      objectIdAttribute: { type: DataTypes.STRING(255), allowNull: true },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'SamlLoginRequest',
    {
      id: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      scope: { type: DataTypes.STRING(255), allowNull: false },
      state: { type: DataTypes.STRING(255), allowNull: false },
      redirectUri: { type: DataTypes.STRING(255), allowNull: false },
      AppSamlSecretId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'AppSamlSecret', key: 'id' },
      },
      UserId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'User', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: true },
      nameId: { type: DataTypes.STRING(255), allowNull: true },
      timezone: { type: DataTypes.STRING(255), allowNull: true },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppSubscription',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      endpoint: { type: DataTypes.STRING(255), allowNull: false },
      p256dh: { type: DataTypes.STRING(255), allowNull: false },
      auth: { type: DataTypes.STRING(255), allowNull: false },
      AppId: {
        onUpdate: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      UserId: {
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'User', key: 'id' },
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppMember',
    {
      role: { type: DataTypes.STRING(255), allowNull: false },
      AppId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      UserId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'User', key: 'id' },
      },
      name: { type: DataTypes.STRING(255), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      emailVerified: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      consent: { type: DataTypes.DATE, allowNull: true },
      password: { type: DataTypes.STRING(255), allowNull: true },
      emailKey: { type: DataTypes.STRING(255), allowNull: true },
      resetKey: { type: DataTypes.STRING(255), allowNull: true },
      picture: { type: DataTypes.BLOB, allowNull: true },
      properties: { type: DataTypes.JSON, allowNull: true },
      locale: { type: DataTypes.STRING(255), allowNull: true },
      scimExternalId: { type: DataTypes.STRING(255), allowNull: true },
      scimActive: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppSamlAuthorization',
    {
      nameId: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      AppSamlSecretId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'AppSamlSecret', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppMemberId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'AppMember', key: 'id' },
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppOAuth2Authorization',
    {
      sub: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      AppOAuth2SecretId: {
        onUpdate: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'AppOAuth2Secret', key: 'id' },
      },
      accessToken: { type: DataTypes.TEXT, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: true },
      refreshToken: { type: DataTypes.TEXT, allowNull: true },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppMemberId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'AppMember', key: 'id' },
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppServiceSecret',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: true },
      urlPatterns: { type: DataTypes.STRING(255), allowNull: false },
      authenticationMethod: { type: DataTypes.STRING(255), allowNull: false },
      identifier: { type: DataTypes.TEXT, allowNull: true },
      secret: { type: DataTypes.BLOB, allowNull: true },
      tokenUrl: { type: DataTypes.STRING(255), allowNull: true },
      accessToken: { type: DataTypes.BLOB, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: true },
      AppId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'App', key: 'id' } },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppSnapshot',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      yaml: { type: DataTypes.TEXT, allowNull: false },
      AppId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
      },
      UserId: { type: DataTypes.UUID, allowNull: true, references: { model: 'User', key: 'id' } },
      created: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppBlockStyle',
    {
      AppId: {
        onUpdate: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'App', key: 'id' },
      },
      block: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      style: { type: DataTypes.TEXT, allowNull: true },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'Team',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      AppId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      annotations: { type: DataTypes.JSON, allowNull: true },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'TeamMember',
    {
      role: { type: DataTypes.ENUM('member', 'manager'), allowNull: false },
      TeamId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Team', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppMemberId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'AppMember', key: 'id' },
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'TeamInvite',
    {
      TeamId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Team', key: 'id' },
      },
      email: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      role: { type: DataTypes.STRING(255), allowNull: false },
      key: { type: DataTypes.STRING(255), allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'Resource',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      type: { type: DataTypes.STRING(255), allowNull: false },
      data: { type: DataTypes.JSON, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppId: {
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
      },
      clonable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      expires: { type: DataTypes.DATE, allowNull: true },
      AuthorId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'AppMember', key: 'id' },
      },
      EditorId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'AppMember', key: 'id' },
      },
      seed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ephemeral: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'Asset',
    {
      mime: { type: DataTypes.STRING(255), allowNull: true },
      filename: { type: DataTypes.STRING(255), allowNull: true },
      data: { type: DataTypes.BLOB, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppId: {
        onUpdate: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
      },
      id: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      ResourceId: {
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Resource', key: 'id' },
      },
      name: { type: DataTypes.STRING, allowNull: true },
      AppMemberId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'AppMember', key: 'id' },
      },
      clonable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      seed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ephemeral: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'ResourceVersion',
    {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      data: { type: DataTypes.JSON, allowNull: true },
      ResourceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Resource', key: 'id' },
        onDelete: 'CASCADE',
      },
      created: { type: DataTypes.DATE, allowNull: false },
      AppMemberId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'AppMember', key: 'id' },
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'ResourceSubscription',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      type: { type: DataTypes.STRING(255), allowNull: true },
      action: { type: DataTypes.STRING(255), allowNull: true },
      ResourceId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Resource', key: 'id' },
      },
      AppSubscriptionId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'AppSubscription', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'OAuth2AuthorizationCode',
    {
      code: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      redirectUri: { type: DataTypes.STRING(255), allowNull: false },
      expires: { type: DataTypes.DATE, allowNull: false },
      AppId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
      },
      UserId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'User', key: 'id' },
      },
      scope: { type: DataTypes.STRING(255), allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'OrganizationInvite',
    {
      email: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      key: { type: DataTypes.STRING(255), allowNull: false },
      OrganizationId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.STRING(255),
        allowNull: false,
        primaryKey: true,
        references: { model: 'Organization', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      UserId: {
        onUpdate: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'User', key: 'id' },
      },
      role: {
        type: DataTypes.ENUM('Member', 'Owner', 'Maintainer', 'AppEditor'),
        allowNull: false,
        defaultValue: 'Member',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'OrganizationMember',
    {
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      OrganizationId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.STRING(255),
        allowNull: false,
        primaryKey: true,
        references: { model: 'Organization', key: 'id' },
      },
      role: {
        type: DataTypes.ENUM(
          'Member',
          'Translator',
          'APIReader',
          'APIUser',
          'Owner',
          'Maintainer',
          'AppEditor',
        ),
        allowNull: false,
        defaultValue: 'Member',
      },
      UserId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'User', key: 'id' },
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'BlockVersion',
    {
      name: { type: DataTypes.STRING(255), allowNull: false },
      version: { type: DataTypes.STRING(255), allowNull: false },
      layout: { type: DataTypes.STRING(255), allowNull: true },
      actions: { type: DataTypes.JSON, allowNull: true },
      parameters: { type: DataTypes.JSON, allowNull: true },
      created: { type: DataTypes.DATE, allowNull: false },
      events: { type: DataTypes.JSON, allowNull: true },
      OrganizationId: {
        onUpdate: 'CASCADE',
        type: DataTypes.STRING(255),
        allowNull: false,
        references: { model: 'Organization', key: 'id' },
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      icon: { type: DataTypes.BLOB, allowNull: true },
      longDescription: { type: DataTypes.TEXT, allowNull: true },
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      wildcardActions: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      visibility: { type: DataTypes.STRING(255), allowNull: false, defaultValue: 'public' },
      examples: { type: DataTypes.JSONB, allowNull: true },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'BlockMessages',
    {
      BlockVersionId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'BlockVersion', key: 'id' },
      },
      language: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      messages: { type: DataTypes.JSON, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'BlockAsset',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      filename: { type: DataTypes.STRING(255), allowNull: false },
      mime: { type: DataTypes.STRING(255), allowNull: true },
      content: { type: DataTypes.BLOB, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      BlockVersionId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'BlockVersion', key: 'id' },
      },
    },
    { transaction },
  );

  const indexes = [
    ['App', 'App_path_OrganizationId_key', ['path', 'OrganizationId']],
    ['BlockVersion', 'blockVersionComposite', ['OrganizationId', 'name', 'version']],
    ['AppMember', 'UniqueAppMemberEmailIndex', ['AppId', 'email']],
    ['AppMember', 'UniqueAppMemberIndex', ['AppId', 'UserId']],
    ['AppCollectionApp', 'UniqueAppCollectionAppIndex', ['AppCollectionId', 'AppId']],
    [
      'OrganizationInvite',
      'OrganizationInvite_UserId_OrganizationId_key',
      ['UserId', 'OrganizationId'],
    ],
    ['Asset', 'UniqueAssetNameIndex', ['AppId', 'name', 'ephemeral']],
  ] satisfies [string, string, string[]][];
  for (const [table, name, cols] of indexes) {
    await queryInterface.addIndex(table, cols, {
      name,
      unique: true,
      transaction,
    });
  }
}

/*
 * Summary:
 */
export function down(): void {
  throw new Error(`Down migration for ${key} not implemented!`);
}

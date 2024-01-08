import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.23.11';

/*
 * Summary:
 * - Create all tables
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  if (tables.some((name) => name !== 'Meta')) {
    logger.info('skipping migration because database is not empty');
    return;
  }
  await queryInterface.createTable('Organization', {
    id: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: true },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    deleted: { type: DataTypes.DATE, allowNull: true },
    icon: { type: DataTypes.BLOB, allowNull: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    website: { type: DataTypes.STRING(255), allowNull: true },
  });
  await queryInterface.createTable('BlockVersion', {
    name: { type: DataTypes.STRING(255), allowNull: false, unique: 'blockVersionComposite' },
    version: { type: DataTypes.STRING(255), allowNull: false, unique: 'blockVersionComposite' },
    layout: { type: DataTypes.STRING(255), allowNull: true },
    actions: { type: DataTypes.JSON, allowNull: true },
    parameters: { type: DataTypes.JSON, allowNull: true },
    created: { type: DataTypes.DATE, allowNull: false },
    events: { type: DataTypes.JSON, allowNull: true },
    OrganizationId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: { model: 'Organization', key: 'id' },
      unique: 'blockVersionComposite',
      onUpdate: 'CASCADE',
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    icon: { type: DataTypes.BLOB, allowNull: true },
    longDescription: { type: DataTypes.TEXT, allowNull: true },
    id: { type: DataTypes.UUID, allowNull: false, primaryKey: true, unique: 'BlockVersion_id_key' },
    wildcardActions: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    visibility: { type: DataTypes.STRING(255), allowNull: false, defaultValue: 'public' },
    examples: { type: DataTypes.JSONB, allowNull: true },
  });
  await queryInterface.addConstraint('BlockVersion', {
    type: 'unique',
    fields: ['id'],
    name: 'BlockVersion_id_key',
  });
  await queryInterface.addConstraint('BlockVersion', {
    type: 'unique',
    fields: ['OrganizationId', 'name', 'version'],
    name: 'blockVersionComposite',
  });
  await queryInterface.createTable('BlockAsset', {
    id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    filename: { type: DataTypes.STRING(255), allowNull: false },
    mime: { type: DataTypes.STRING(255), allowNull: true },
    content: { type: DataTypes.BLOB, allowNull: false },
    created: { type: DataTypes.DATE, allowNull: false },
    BlockVersionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'BlockVersion', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  });
  await queryInterface.createTable('User', {
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
  });
  await queryInterface.createTable('Training', {
    id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    competence: { type: DataTypes.STRING(255), allowNull: true },
    difficultyLevel: { type: DataTypes.INTEGER, allowNull: true },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.createTable('UserTraining', {
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
  });
  await queryInterface.createTable('App', {
    id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    definition: { type: DataTypes.JSON, allowNull: false },
    domain: { type: DataTypes.STRING(253), allowNull: true },
    icon: { type: DataTypes.BLOB, allowNull: true },
    path: { type: DataTypes.STRING(255), allowNull: true, unique: 'App_path_OrganizationId_key' },
    coreStyle: { type: DataTypes.TEXT, allowNull: true },
    sharedStyle: { type: DataTypes.TEXT, allowNull: true },
    OrganizationId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: { model: 'Organization', key: 'id' },
      unique: 'App_path_OrganizationId_key',
      onUpdate: 'CASCADE',
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
    showAppsembleLogin: { type: DataTypes.STRING(255), allowNull: true, defaultValue: false },
    googleAnalyticsID: { type: DataTypes.STRING(255), allowNull: true },
    sentryDsn: { type: DataTypes.STRING(255), allowNull: true },
    sentryEnvironment: { type: DataTypes.STRING(255), allowNull: true },
    visibility: { type: DataTypes.STRING(255), allowNull: false, defaultValue: 'unlisted' },
    showAppDefinition: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    emailName: { type: DataTypes.STRING(255), allowNull: true },
    emailHost: { type: DataTypes.STRING(255), allowNull: true },
    emailUser: { type: DataTypes.STRING(255), allowNull: true },
    enableSelfRegistration: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
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
  });
  await queryInterface.addConstraint('App', {
    type: 'unique',
    fields: ['path', 'OrganizationId'],
    name: 'App_path_OrganizationId_key',
  });
  await queryInterface.createTable('Team', {
    id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'App', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    annotations: { type: DataTypes.JSON, allowNull: true },
  });
  await queryInterface.createTable('TeamInvite', {
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
  });
  await queryInterface.createTable('TrainingBlock', {
    id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
    TrainingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Training', key: 'id' },
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    documentationLink: { type: DataTypes.STRING(255), allowNull: true },
    videoLink: { type: DataTypes.STRING(255), allowNull: true },
    exampleCode: { type: DataTypes.STRING(255), allowNull: true },
    externalResource: { type: DataTypes.STRING(255), allowNull: true },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.createTable('AppSnapshot', {
    id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    yaml: { type: DataTypes.TEXT, allowNull: false },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'App', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    UserId: { type: DataTypes.UUID, allowNull: true, references: { model: 'User', key: 'id' } },
    created: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.createTable('OAuthAuthorization', {
    sub: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    authorizationUrl: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    accessToken: { type: DataTypes.TEXT, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    refreshToken: { type: DataTypes.TEXT, allowNull: true },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    code: { type: DataTypes.TEXT, allowNull: true },
    UserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  });
  await queryInterface.createTable('AppBlockStyle', {
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'App', key: 'id' },
      onUpdate: 'CASCADE',
    },
    block: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    style: { type: DataTypes.TEXT, allowNull: true },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.createTable('AppMember', {
    role: { type: DataTypes.STRING(255), allowNull: false },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'App', key: 'id' },
      unique: 'UniqueAppMemberIndex',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    UserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      unique: 'UniqueAppMemberIndex',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    name: { type: DataTypes.STRING(255), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true, unique: 'UniqueAppMemberEmailIndex' },
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
  });
  await queryInterface.addConstraint('AppMember', {
    type: 'unique',
    fields: ['AppId', 'UserId'],
    name: 'UniqueAppMemberIndex',
  });
  await queryInterface.addConstraint('AppMember', {
    type: 'unique',
    fields: ['AppId', 'email'],
    name: 'UniqueAppMemberEmailIndex',
  });
  await queryInterface.createTable('Resource', {
    id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    type: { type: DataTypes.STRING(255), allowNull: false },
    data: { type: DataTypes.JSON, allowNull: false },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'App', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    clonable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    expires: { type: DataTypes.DATE, allowNull: true },
    AuthorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'AppMember', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    EditorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'AppMember', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  });
  await queryInterface.createTable('AppSubscription', {
    id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    endpoint: { type: DataTypes.STRING(255), allowNull: false },
    p256dh: { type: DataTypes.STRING(255), allowNull: false },
    auth: { type: DataTypes.STRING(255), allowNull: false },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'App', key: 'id' },
      onUpdate: 'CASCADE',
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    UserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  });
  await queryInterface.createTable('ResourceSubscription', {
    id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    type: { type: DataTypes.STRING(255), allowNull: true },
    action: { type: DataTypes.STRING(255), allowNull: true },
    ResourceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Resource', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    AppSubscriptionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'AppSubscription', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.createTable('Theme', {
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
  });
  await queryInterface.createTable('TeamMember', {
    role: { type: DataTypes.ENUM('member', 'manager'), allowNull: false },
    TeamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Team', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    AppMemberId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'AppMember', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  });
  await queryInterface.createTable('AppSamlSecret', {
    id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'App', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
  });
  await queryInterface.createTable('SamlLoginRequest', {
    id: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    scope: { type: DataTypes.STRING(255), allowNull: false },
    state: { type: DataTypes.STRING(255), allowNull: false },
    redirectUri: { type: DataTypes.STRING(255), allowNull: false },
    AppSamlSecretId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'AppSamlSecret', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    UserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: true },
    nameId: { type: DataTypes.STRING(255), allowNull: true },
    timezone: { type: DataTypes.STRING(255), allowNull: true },
  });
  await queryInterface.createTable('ResourceVersion', {
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
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'AppMember', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  });
  await queryInterface.createTable('OAuth2ClientCredentials', {
    id: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    description: { type: DataTypes.STRING(255), allowNull: false },
    secret: { type: DataTypes.STRING(255), allowNull: false },
    expires: { type: DataTypes.DATE, allowNull: true },
    scopes: { type: DataTypes.STRING(255), allowNull: false },
    created: { type: DataTypes.DATE, allowNull: false },
    UserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  });
  await queryInterface.createTable('OrganizationInvite', {
    email: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    key: { type: DataTypes.STRING(255), allowNull: false },
    OrganizationId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      references: { model: 'Organization', key: 'id' },
      unique: 'OrganizationInvite_UserId_OrganizationId_key',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    UserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      unique: 'OrganizationInvite_UserId_OrganizationId_key',
      onUpdate: 'CASCADE',
    },
    role: {
      type: DataTypes.ENUM('Member', 'Owner', 'Maintainer', 'AppEditor'),
      allowNull: false,
      defaultValue: 'Member',
    },
  });
  await queryInterface.addConstraint('OrganizationInvite', {
    type: 'unique',
    fields: ['UserId', 'OrganizationId'],
    name: 'OrganizationInvite_UserId_OrganizationId_key',
  });
  await queryInterface.createTable('ResetPasswordToken', {
    token: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    UserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  });
  await queryInterface.createTable('OAuth2AuthorizationCode', {
    code: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    redirectUri: { type: DataTypes.STRING(255), allowNull: false },
    expires: { type: DataTypes.DATE, allowNull: false },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'App', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    UserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    scope: { type: DataTypes.STRING(255), allowNull: false },
  });
  await queryInterface.createTable('OrganizationMember', {
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    OrganizationId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      references: { model: 'Organization', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  });
  await queryInterface.createTable('BlockMessages', {
    BlockVersionId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: { model: 'BlockVersion', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    language: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    messages: { type: DataTypes.JSON, allowNull: false },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.createTable('Meta', {
    version: { type: DataTypes.STRING(11), allowNull: false, primaryKey: true },
  });
  await queryInterface.createTable('EmailAuthorization', {
    email: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    key: { type: DataTypes.STRING(255), allowNull: true },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    UserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
    },
  });
  await queryInterface.createTable('Asset', {
    mime: { type: DataTypes.STRING(255), allowNull: true },
    filename: { type: DataTypes.STRING(255), allowNull: true },
    data: { type: DataTypes.BLOB, allowNull: false },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'App', key: 'id' },
      unique: 'UniqueAssetNameIndex',
      onUpdate: 'CASCADE',
    },
    id: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    ResourceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Resource', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    name: { type: DataTypes.STRING, allowNull: true, unique: 'UniqueAssetNameIndex' },
    AppMemberId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'AppMember', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  });
  await queryInterface.addConstraint('Asset', {
    type: 'unique',
    fields: ['AppId', 'name'],
    name: 'UniqueAssetNameIndex',
  });
  await queryInterface.createTable('AppServiceSecret', {
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
  });
  await queryInterface.createTable('AppScreenshot', {
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'App', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    screenshot: { type: DataTypes.BLOB, allowNull: false },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: true },
    width: { type: DataTypes.INTEGER, allowNull: false },
    height: { type: DataTypes.INTEGER, allowNull: false },
    mime: { type: DataTypes.STRING(255), allowNull: false },
  });
  await queryInterface.createTable('AppSamlAuthorization', {
    nameId: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    AppSamlSecretId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'AppSamlSecret', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    AppMemberId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'AppMember', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  });
  await queryInterface.createTable('AppRating', {
    rating: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'App', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    UserId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
    },
  });
  await queryInterface.createTable('AppOAuth2Secret', {
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
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'App', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.createTable('AppOAuth2Authorization', {
    sub: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    AppOAuth2SecretId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'AppOAuth2Secret', key: 'id' },
      onUpdate: 'CASCADE',
    },
    accessToken: { type: DataTypes.TEXT, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    refreshToken: { type: DataTypes.TEXT, allowNull: true },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    AppMemberId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  });
  await queryInterface.addConstraint('AppOAuth2Authorization', {
    type: 'foreign key',
    name: 'AppOAuth2Authorization_AppMemberId_fk',
    fields: ['AppMemberId'],
    references: {
      table: 'AppMember',
      field: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
  await queryInterface.createTable('AppCollection', {
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
  });
  await queryInterface.createTable('AppCollectionApp', {
    id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    AppCollectionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'AppCollection', key: 'id' },
      unique: 'UniqueAppCollectionAppIndex',
      onDelete: 'CASCADE',
    },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'App', key: 'id' },
      unique: 'UniqueAppCollectionAppIndex',
    },
    pinnedAt: { type: DataTypes.DATE, allowNull: true },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addConstraint('AppCollectionApp', {
    type: 'unique',
    fields: ['AppCollectionId', 'AppId'],
    name: 'UniqueAppCollectionAppIndex',
  });
  await queryInterface.createTable('AppEmailQuotaLog', {
    id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    AppId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'App', key: 'id' } },
    created: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.createTable('AppMessages', {
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'App', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    language: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
    messages: { type: DataTypes.JSON, allowNull: true },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });
}

/*
 * Summary:
 * - Drop all tables
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function down(db: Sequelize): Promise<void> {
  // Ignore
  // const queryInterface = db.getQueryInterface();
  // await queryInterface.dropTable('BlockAsset');
  // await queryInterface.dropTable('UserTraining');
  // await queryInterface.dropTable('TeamInvite');
  // await queryInterface.dropTable('Training');
  // await queryInterface.dropTable('TrainingBlock');
  // await queryInterface.dropTable('AppSnapshot');
  // await queryInterface.dropTable('User');
  // await queryInterface.dropTable('OAuthAuthorization');
  // await queryInterface.dropTable('AppBlockStyle');
  // await queryInterface.dropTable('ResourceSubscription');
  // await queryInterface.dropTable('Theme');
  // await queryInterface.dropTable('TeamMember');
  // await queryInterface.dropTable('SamlLoginRequest');
  // await queryInterface.dropTable('Organization');
  // await queryInterface.dropTable('ResourceVersion');
  // await queryInterface.dropTable('Team');
  // await queryInterface.dropTable('OAuth2ClientCredentials');
  // await queryInterface.dropTable('BlockVersion');
  // await queryInterface.dropTable('OrganizationInvite');
  // await queryInterface.dropTable('ResetPasswordToken');
  // await queryInterface.dropTable('Resource');
  // await queryInterface.dropTable('OAuth2AuthorizationCode');
  // await queryInterface.dropTable('OrganizationMember');
  // await queryInterface.dropTable('BlockMessages');
  // await queryInterface.dropTable('Meta');
  // await queryInterface.dropTable('EmailAuthorization');
  // await queryInterface.dropTable('Asset');
  // await queryInterface.dropTable('AppMember');
  // await queryInterface.dropTable('AppServiceSecret');
  // await queryInterface.dropTable('AppSubscription');
  // await queryInterface.dropTable('AppSamlSecret');
  // await queryInterface.dropTable('App');
  // await queryInterface.dropTable('AppScreenshot');
  // await queryInterface.dropTable('AppSamlAuthorization');
  // await queryInterface.dropTable('AppRating');
  // await queryInterface.dropTable('AppOAuth2Secret');
  // await queryInterface.dropTable('AppOAuth2Authorization');
  // await queryInterface.dropTable('AppCollectionApp');
  // await queryInterface.dropTable('AppCollection');
  // await queryInterface.dropTable('AppEmailQuotaLog');
  // await queryInterface.dropTable('AppMessages');
}

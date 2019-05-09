module.exports = {
  async up(queryInterface, DataTypes) {
    await Promise.all([
      // Create tables
      queryInterface.createTable('App', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        definition: { type: DataTypes.JSON, allowNull: false },
        description: { type: DataTypes.STRING(80), allowNull: true },
        icon: { type: DataTypes.BLOB('long') },
        path: { type: DataTypes.STRING, unique: true, allowNull: false },
        style: { type: DataTypes.TEXT('long') },
        sharedStyle: { type: DataTypes.TEXT('long') },
        yaml: { type: DataTypes.TEXT('long') },
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
        deleted: { allowNull: true, type: DataTypes.DATE },
      }),
      queryInterface.createTable('AppBlockStyle', {
        style: { type: DataTypes.TEXT('long') },
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
        deleted: { allowNull: true, type: DataTypes.DATE },
      }),
      queryInterface.createTable('Asset', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        mime: { type: DataTypes.STRING, allowNull: true },
        filename: { type: DataTypes.STRING, allowNull: true },
        data: { type: DataTypes.BLOB('long'), allowNull: false },
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
        deleted: { allowNull: true, type: DataTypes.DATE },
      }),
      queryInterface.createTable('BlockAsset', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        filename: { type: DataTypes.STRING },
        mime: { type: DataTypes.STRING },
        content: { type: DataTypes.BLOB('long') },
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
        deleted: { allowNull: true, type: DataTypes.DATE },
      }),
      queryInterface.createTable('BlockDefinition', {
        id: { type: DataTypes.STRING, primaryKey: true },
        description: DataTypes.STRING,
      }),
      queryInterface.createTable('BlockVersion', {
        name: { type: DataTypes.STRING, primaryKey: true, unique: 'blockVersionComposite' },
        version: { type: DataTypes.STRING, primaryKey: true, unique: 'blockVersionComposite' },
        layout: { type: DataTypes.STRING },
        actions: { type: DataTypes.JSON },
        resources: { type: DataTypes.JSON },
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
        deleted: { allowNull: true, type: DataTypes.DATE },
      }),
      queryInterface.createTable('EmailAuthorization', {
        email: { type: DataTypes.STRING, primaryKey: true },
        name: DataTypes.STRING,
        password: { type: DataTypes.STRING, allowNull: false },
        verified: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        key: DataTypes.STRING,
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
        deleted: { allowNull: true, type: DataTypes.DATE },
      }),
      queryInterface.createTable('OAuthAuthorization', {
        id: { type: DataTypes.STRING, primaryKey: true },
        provider: { type: DataTypes.STRING, primaryKey: true },
        token: { type: DataTypes.TEXT, allowNull: false },
        expiresAt: { type: DataTypes.DATE, allowNull: true },
        refreshToken: { type: DataTypes.TEXT, allowNull: true },
        verified: { type: DataTypes.BOOLEAN, default: false },
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
      }),
      queryInterface.createTable('OAuthClient', {
        clientId: { type: DataTypes.STRING, primaryKey: true },
        clientSecret: { type: DataTypes.STRING, primaryKey: true },
        redirectUri: { type: DataTypes.STRING, allowNull: false },
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
        deleted: { allowNull: true, type: DataTypes.DATE },
      }),
      queryInterface.createTable('OAuthToken', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        token: { type: DataTypes.TEXT, allowNull: false },
        refreshToken: { type: DataTypes.TEXT, allowNull: false },
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
      }),
      queryInterface.createTable('Organization', {
        id: { type: DataTypes.STRING, primaryKey: true },
        coreStyle: { type: DataTypes.TEXT('long') },
        sharedStyle: { type: DataTypes.TEXT('long') },
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
        deleted: { allowNull: true, type: DataTypes.DATE },
      }),
      queryInterface.createTable('OrganizationBlockStyle', {
        style: { type: DataTypes.TEXT('long') },
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
        deleted: { allowNull: true, type: DataTypes.DATE },
      }),
      queryInterface.createTable('ResetPasswordToken', {
        token: { type: DataTypes.STRING, primaryKey: true },
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
      }),
      queryInterface.createTable('Resource', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        type: DataTypes.STRING,
        data: DataTypes.JSON,
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
        deleted: { allowNull: true, type: DataTypes.DATE },
      }),
      queryInterface.createTable('User', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
        deleted: { allowNull: true, type: DataTypes.DATE },
      }),
    ]);
    await Promise.all([
      // Add associations
      queryInterface.addColumn('App', 'OrganizationId', {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Organization',
          key: 'id',
        },
      }),
      queryInterface.addColumn('AppBlockStyle', 'AppId', {
        type: DataTypes.INTEGER,
        references: {
          model: 'App',
          key: 'id',
        },
      }),
      queryInterface.addColumn('AppBlockStyle', 'BlockDefinitionId', {
        type: DataTypes.STRING,
        references: {
          model: 'BlockDefinition',
          key: 'id',
        },
      }),
      queryInterface.addConstraint('BlockVersion', ['name'], {
        type: 'foreign key',
        references: { table: 'BlockDefinition', field: 'id' },
      }),
      queryInterface.addColumn('BlockAsset', 'name', {
        type: DataTypes.STRING,
        references: {
          model: 'BlockVersion',
          key: 'name',
        },
      }),
      // queryInterface.addColumn('BlockAsset', 'version', {
      //   type: DataTypes.STRING,
      //   references: {
      //     model: 'BlockVersion',
      //     key: 'version',
      //   },
      // }),
      queryInterface.addColumn('EmailAuthorization', 'UserId', {
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
          key: 'id',
        },
      }),
      queryInterface.addColumn('OAuthAuthorization', 'UserId', {
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
          key: 'id',
        },
      }),
      queryInterface.addColumn('OAuthToken', 'UserId', {
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
          key: 'id',
        },
      }),
      queryInterface.addColumn('Organization', 'OrganizationId', {
        type: DataTypes.STRING,
        references: {
          model: 'Organization',
          key: 'id',
        },
      }),
      queryInterface.addColumn('OrganizationBlockStyle', 'OrganizationId', {
        type: DataTypes.STRING,
        references: {
          model: 'Organization',
          key: 'id',
        },
      }),
      queryInterface.addColumn('OrganizationBlockStyle', 'BlockDefinitionId', {
        type: DataTypes.STRING,
        references: {
          model: 'BlockDefinition',
          key: 'id',
        },
      }),
      queryInterface.addColumn('ResetPasswordToken', 'EmailAuthorizationEmail', {
        type: DataTypes.STRING,
        allowNull: false,
        onDelete: 'CASCADE',
        references: {
          model: 'EmailAuthorization',
          key: 'email',
        },
      }),
      queryInterface.addColumn('Resource', 'AppId', {
        type: DataTypes.INTEGER,
        references: {
          model: 'App',
          key: 'id',
        },
      }),
      queryInterface.addColumn('Resource', 'UserId', {
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
          key: 'id',
        },
      }),
      queryInterface.createTable('UserOrganization', {
        UserId: { type: DataTypes.INTEGER, references: { model: 'User', key: 'id' } },
        OrganizationId: {
          type: DataTypes.STRING,
          references: { model: 'Organization', key: 'id' },
        },
        created: { allowNull: false, type: DataTypes.DATE },
        updated: { allowNull: false, type: DataTypes.DATE },
      }),
    ]);
  },
  down(queryInterface) {
    return Promise.all([
      queryInterface.dropTable('App'),
      queryInterface.dropTable('AppBlockStyle'),
      queryInterface.dropTable('Asset'),
      queryInterface.dropTable('BlockAsset'),
      queryInterface.dropTable('BlockDefinition'),
      queryInterface.dropTable('BlockVersion'),
      queryInterface.dropTable('EmailAuthorization'),
      queryInterface.dropTable('OAuthAuthorization'),
      queryInterface.dropTable('OAuthClient'),
      queryInterface.dropTable('OAuthToken'),
      queryInterface.dropTable('Organization'),
      queryInterface.dropTable('OrganizationBlockStyle'),
      queryInterface.dropTable('ResetPasswordToken'),
      queryInterface.dropTable('Resource'),
      queryInterface.dropTable('User'),
    ]);
  },
};

import Sequelize from 'sequelize';

import logSQL from './logSQL';

function importModels(db) {
  db.import('../models/App');
  db.import('../models/Snapshot');
  db.import('../models/User');
  db.import('../models/Organization');
  db.import('../models/EmailAuthorization');
  db.import('../models/ResetPasswordToken');
  db.import('../models/OAuthAuthorization');
  db.import('../models/OAuthClient');
  db.import('../models/OAuthToken');
  db.import('../models/Resource');
  db.import('../models/Asset');
  db.import('../models/BlockAsset');
  db.import('../models/BlockDefinition');
  db.import('../models/BlockVersion');
}

function associateModels(models) {
  const {
    App,
    Snapshot,
    User,
    Organization,
    EmailAuthorization,
    OAuthToken,
    ResetPasswordToken,
    OAuthAuthorization,
    Resource,
    BlockDefinition,
    BlockVersion,
    BlockAsset,
  } = models;

  // Model relationships
  User.belongsToMany(Organization, { through: 'UserOrganization' });
  User.hasMany(OAuthToken);
  User.hasMany(OAuthAuthorization);
  User.hasOne(EmailAuthorization);

  EmailAuthorization.belongsTo(User);
  EmailAuthorization.hasMany(ResetPasswordToken, {
    foreignKey: { allowNull: false },
    onDelete: 'CASCADE',
  });

  OAuthAuthorization.belongsTo(User);
  ResetPasswordToken.belongsTo(EmailAuthorization, {
    foreignKey: { allowNull: false },
    onDelete: 'CASCADE',
  });

  Organization.hasOne(Organization);

  Snapshot.belongsTo(App, { foreignKey: { allowNull: false } });

  App.hasMany(Snapshot);
  App.hasMany(Resource);

  Resource.belongsTo(User);
  Resource.belongsTo(App);

  BlockDefinition.hasMany(BlockVersion, { foreignKey: 'name', sourceKey: 'id' });
  BlockVersion.hasMany(BlockAsset, { foreignKey: 'name', sourceKey: 'name' });
  BlockVersion.hasMany(BlockAsset, { foreignKey: 'version', sourceKey: 'version' });
}

export default async function setupModels({
  dialect = 'mysql',
  sync = true,
  force = false,
  logging = false,
  host = process.env.NODE_ENV === 'production' ? 'mysql' : 'localhost',
  port,
  username,
  password,
  database,
  uri,
}) {
  const options = {
    logging: logging && logSQL,
    // XXX: This removes a pesky sequelize warning. Remove this when updating to sequelize@^5.
    operatorsAliases: Sequelize.Op.Aliases,
    retry: { max: 3 },
  };
  let args;
  if (uri) {
    args = [uri, options];
  } else {
    args = [
      Object.assign(options, {
        dialect,
        host,
        port,
        username,
        password,
        database,
      }),
    ];
  }
  const db = new Sequelize(...args);
  importModels(db);
  associateModels(db.models);

  if (sync) {
    await db.sync({ force });
  }

  return db;
}

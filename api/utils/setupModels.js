import Sequelize from 'sequelize';

function importModels(db) {
  const App = db.import('../models/App');
  const Snapshot = db.import('../models/Snapshot');
  const User = db.import('../models/User');
  const Organization = db.import('../models/Organization');
  const EmailAuthorization = db.import('../models/EmailAuthorization');
  const OAuthToken = db.import('../models/OAuthToken');
  const OAuthAuthorization = db.import('../models/OAuthAuthorization');
  const OAuthClient = db.import('../models/OAuthClient');
  const Resource = db.import('../models/Resource');
  const Asset = db.import('../models/Asset');
  const Block = db.import('../models/Block');
  const BlockVersion = db.import('../models/BlockVersion');

  return {
    App,
    Snapshot,
    User,
    Organization,
    EmailAuthorization,
    OAuthToken,
    OAuthAuthorization,
    OAuthClient,
    Resource,
    Asset,
    Block,
    BlockVersion,
  };
}

function associateModels(models) {
  const {
    App,
    Snapshot,
    User,
    Organization,
    EmailAuthorization,
    OAuthToken,
    OAuthAuthorization,
    Resource,
    Block,
    BlockVersion,
  } = models;

  // Model relationships
  User.belongsToMany(Organization, { through: 'UserOrganization' });
  User.hasMany(OAuthToken);
  User.hasMany(OAuthAuthorization);
  User.hasOne(EmailAuthorization);

  EmailAuthorization.belongsTo(User);

  Organization.hasOne(Organization);

  Snapshot.belongsTo(App, { foreignKey: { allowNull: false } });

  App.hasMany(Snapshot);
  App.hasMany(Resource);

  Resource.belongsTo(User);
  Resource.belongsTo(App);

  Block.hasMany(BlockVersion);
  BlockVersion.belongsTo(Block, { foreignKey: { allowNull: false } });
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
    logging,
    // XXX: This removes a pesky sequelize warning. Remove this when updating to sequelize@^5.
    operatorsAliases: Sequelize.Op.Aliases,
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
  const models = importModels(db);
  associateModels(models);

  if (sync) {
    await db.sync({ force });
  }

  return { sequelize: db, Sequelize, ...models };
}

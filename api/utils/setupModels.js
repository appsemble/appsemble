import Sequelize from 'sequelize';

function importModels(db) {
  const App = db.import('../models/App');
  const Snapshot = db.import('../models/Snapshot');
  const User = db.import('../models/User');
  const Organization = db.import('../models/Organization');
  const EmailAuthorization = db.import('../models/EmailAuthorization');
  const OAuthAuthorization = db.import('../models/OAuthAuthorization');
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
    OAuthAuthorization,
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
    OAuthAuthorization,
    Resource,
    Block,
    BlockVersion,
  } = models;

  // Model relationships
  User.belongsToMany(Organization, { through: 'UserOrganization' });
  User.hasMany(OAuthAuthorization);
  User.hasOne(EmailAuthorization);

  Organization.hasOne(Organization);

  Snapshot.belongsTo(App, { foreignKey: { allowNull: false } });

  App.hasMany(Snapshot);

  Resource.belongsTo(User);
  Resource.belongsTo(App);

  Block.hasMany(BlockVersion);
  BlockVersion.belongsTo(Block, { foreignKey: { allowNull: false } });
}

export default async function setupModels(sync = true, force = false) {
  const connectionString = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/appsemble';
  const db = new Sequelize(connectionString, { logging: false });

  const models = importModels(db);
  associateModels(models);

  if (sync) {
    await db.sync({ force });
  }

  return { sequelize: db, Sequelize, ...models };
}

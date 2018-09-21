import { getSequelizePool } from '../middleware/sequelize';

function importModels(db) {
  const App = db.import(`${__dirname}/App.js`);
  const Snapshot = db.import(`${__dirname}/Snapshot.js`);
  const User = db.import(`${__dirname}/User.js`);
  const Organization = db.import(`${__dirname}/Organization.js`);
  const EmailAuthorization = db.import(`${__dirname}/EmailAuthorization.js`);
  const OAuthAuthorization = db.import(`${__dirname}/OAuthAuthorization.js`);
  const Resource = db.import(`${__dirname}/Resource.js`);
  const Asset = db.import(`${__dirname}/Asset.js`);
  const Block = db.import(`${__dirname}/Block.js`);
  const BlockVersion = db.import(`${__dirname}/BlockVersion.js`);

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

export function setupModels(sync = true, force = false) {
  const db = getSequelizePool();
  const models = importModels(db);
  associateModels(models);

  if (sync) {
    db.sync({ force });
  }

  return models;
}

export const {
  App,
  Snapshot,
  User,
  Organization,
  EmailAuthorization,
  OAuthAuthorization,
  Resource,
  Block,
  BlockVersion,
} = setupModels(false);

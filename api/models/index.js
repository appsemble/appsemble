import Sequelize from 'sequelize';

import { getSequelizePool } from '../utils/db';

const db = getSequelizePool();

// Model definitions
const App = db.define('App', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  definition: { type: Sequelize.JSON, allowNull: false },
}, {
  freezeTableName: true,
  paranoid: true,
});

const Snapshot = db.define('Snapshot', {
  version: { type: Sequelize.STRING, primaryKey: true },
  definition: { type: Sequelize.JSON, allowNull: false },
}, {
  freezeTableName: true,
  paranoid: true,
});

const User = db.define('User', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
}, {
  freezeTableName: true,
  paranoid: true,
});

const Organization = db.define('Organization', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: Sequelize.STRING,
}, {
  freezeTableName: true,
  paranoid: true,
});

const EmailAuthorization = db.define('EmailAuthorization', {
  email: { type: Sequelize.STRING, primaryKey: true },
  name: Sequelize.STRING,
  password: { type: Sequelize.STRING, allowNull: false },
  verified: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
}, {
  freezeTableName: true,
  paranoid: true,
});

const OAuthAuthorization = db.define('OAuthAuthorization', {
  id: { type: Sequelize.STRING, primaryKey: true },
  provider: { type: Sequelize.STRING, allowNull: false },
}, {
  freezeTableName: true,
  paranoid: true,
});

const Resource = db.define('Resource', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  type: Sequelize.STRING,
}, {
  freezeTableName: true,
  paranoid: true,
});

const Asset = db.define('Asset', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  mime: { type: Sequelize.STRING, allowNull: false },
  filename: { type: Sequelize.STRING, allowNull: false },
  data: { type: Sequelize.BLOB, allowNull: false },
}, {
  freezeTableName: true,
  paranoid: true,
});

const Block = db.define('Block', {
  name: { type: Sequelize.STRING, primaryKey: true },
  description: Sequelize.STRING,
}, {
  freezeTableName: true,
  paranoid: true,
});

const BlockVersion = db.define('BlockVersion', {
  name: { type: Sequelize.STRING, primaryKey: true },
}, {
  freezeTableName: true,
  paranoid: true,
});

// Model relationships
User.belongsToMany(Organization, { through: 'UserOrganization' });
User.hasMany(OAuthAuthorization);
User.hasOne(EmailAuthorization);

Organization.hasOne(Organization, { as: 'parentOrganization' });

Snapshot.belongsTo(App, { foreignKey: { allowNull: false } });

App.hasMany(Snapshot);

Resource.belongsTo(User);
Resource.belongsTo(App);

Block.hasMany(BlockVersion);
BlockVersion.belongsTo(Block, { foreignKey: { allowNull: false } });

// Sync / commit model to DB
db.sync({ force: true });

export {
  App, Snapshot, User, Organization, EmailAuthorization,
  OAuthAuthorization, Resource, Asset, Block, BlockVersion,
};

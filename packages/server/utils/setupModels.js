import { AppsembleError } from '@appsemble/node-utils';
import Sequelize from 'sequelize';

import logSQL from './logSQL';

export function handleDbException(dbException) {
  switch (dbException.name) {
    case 'SequelizeConnectionError':
    case 'SequelizeAccessDeniedError':
      throw new AppsembleError(`${dbException.name}: ${dbException.original.sqlMessage}`);
    case 'SequelizeHostNotFoundError':
      throw new AppsembleError(
        `${dbException.name}: Could not find host ´${dbException.original.hostname}:${dbException.original.port}´`,
      );
    case 'SequelizeConnectionRefusedError':
      throw new AppsembleError(
        `${dbException.name}: Connection refused on address ´${dbException.original.address}:${dbException.original.port}´`,
      );
    default:
      throw dbException;
  }
}

function importModels(db) {
  db.import('../models/App');
  db.import('../models/Member');
  db.import('../models/User');
  db.import('../models/Organization');
  db.import('../models/OrganizationInvite');
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
  db.import('../models/AppBlockStyle');
  db.import('../models/OrganizationBlockStyle');
  db.import('../models/Meta');
  db.import('../models/AppSubscription');
  db.import('../models/AppRating');
}

export default async function setupModels({
  host = process.env.NODE_ENV === 'production' ? 'postgres' : 'localhost',
  port,
  username,
  password,
  database,
  uri,
  ssl = false,
}) {
  const options = {
    logging: logSQL,
    retry: { max: 3 },
  };
  let args;
  if (uri) {
    args = [uri, options];
  } else {
    args = [
      Object.assign(options, {
        dialect: 'postgres',
        host,
        port,
        username,
        password,
        database,
        dialectOptions: {
          ssl,
        },
      }),
    ];
  }
  const db = new Sequelize(...args);
  importModels(db);
  Object.values(db.models).forEach(model => model.associate(db.models));

  return db;
}

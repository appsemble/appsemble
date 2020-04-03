import Sequelize from 'sequelize';

import { logSQL } from '../utils/sqlUtils';
import App from './App';
import AppBlockStyle from './AppBlockStyle';
import AppMember from './AppMember';
import AppRating from './AppRating';
import AppSubscription from './AppSubscription';
import Asset from './Asset';
import BlockAsset from './BlockAsset';
import BlockVersion from './BlockVersion';
import EmailAuthorization from './EmailAuthorization';
import Member from './Member';
import Meta from './Meta';
import OAuth2AuthorizationCode from './OAuth2AuthorizationCode';
import OAuth2ClientCredentials from './OAuth2ClientCredentials';
import OAuthAuthorization from './OAuthAuthorization';
import Organization from './Organization';
import OrganizationBlockStyle from './OrganizationBlockStyle';
import OrganizationInvite from './OrganizationInvite';
import ResetPasswordToken from './ResetPasswordToken';
import Resource from './Resource';
import ResourceSubscription from './ResourceSubscription';
import User from './User';

let db;

export function initDB({
  host = process.env.NODE_ENV === 'production' ? 'postgres' : 'localhost',
  port,
  username,
  password,
  database,
  uri,
  ssl = false,
}) {
  if (db) {
    throw new Error('initDB() was called multiple times within the same context.');
  }
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
  db = new Sequelize(...args);

  App(db);
  Member(db);
  User(db);
  AppMember(db);
  Organization(db);
  OrganizationInvite(db);
  EmailAuthorization(db);
  ResetPasswordToken(db);
  OAuthAuthorization(db);
  OAuth2AuthorizationCode(db);
  OAuth2ClientCredentials(db);
  Resource(db);
  Asset(db);
  BlockAsset(db);
  BlockVersion(db);
  AppBlockStyle(db);
  OrganizationBlockStyle(db);
  Meta(db);
  AppSubscription(db);
  AppRating(db);
  ResourceSubscription(db);

  Object.values(db.models).forEach((model) => model.associate(db.models));

  return db;
}

export function getDB() {
  if (!db) {
    throw new Error('The database hasn’t ben initialized yet. Call initDB() first.');
  }
  return db;
}

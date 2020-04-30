import { Options, Sequelize, Transaction } from 'sequelize';

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

let db: Sequelize;

export interface InitDBParams {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  uri?: string;
  ssl?: boolean;
}

const models = [
  App,
  AppBlockStyle,
  AppMember,
  AppRating,
  AppSubscription,
  Asset,
  BlockAsset,
  BlockVersion,
  EmailAuthorization,
  Member,
  Meta,
  OAuth2AuthorizationCode,
  OAuth2ClientCredentials,
  OAuthAuthorization,
  Organization,
  OrganizationBlockStyle,
  OrganizationInvite,
  ResetPasswordToken,
  Resource,
  ResourceSubscription,
  User,
];

export {
  App,
  AppBlockStyle,
  AppMember,
  AppRating,
  AppSubscription,
  Asset,
  BlockAsset,
  BlockVersion,
  EmailAuthorization,
  Member,
  Meta,
  OAuth2AuthorizationCode,
  OAuth2ClientCredentials,
  OAuthAuthorization,
  Organization,
  OrganizationBlockStyle,
  OrganizationInvite,
  ResetPasswordToken,
  Resource,
  ResourceSubscription,
  User,
};

export function initDB({
  host = process.env.NODE_ENV === 'production' ? 'postgres' : 'localhost',
  port,
  username,
  password,
  database,
  uri,
  ssl = false,
}: InitDBParams): Sequelize {
  if (db) {
    throw new Error('initDB() was called multiple times within the same context.');
  }
  const options: Options = {
    logging: logSQL,
    retry: { max: 3 },
  };
  let args: [Options] | [string, Options];
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
          ssl: ssl && { rejectUnauthorized: false },
        },
      }),
    ];
  }
  db = new Sequelize(...(args as [Options]));

  models.forEach((model) => model.initialize(db));
  models.forEach((model) => model.associate && model.associate());

  return db;
}

export function getDB(): Sequelize {
  if (!db) {
    throw new Error('The database hasn’t ben initialized yet. Call initDB() first.');
  }
  return db;
}

/**
 * Run queries in a transaction.
 *
 * If the callback function fails, the transaction will be rolled back.
 *
 * @param callback The function that will be called with a transaction.
 */
export async function transactional<T>(
  callback: (transaction: Transaction) => Promise<T>,
): Promise<T> {
  return getDB().transaction(callback);
}

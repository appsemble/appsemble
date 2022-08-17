import { Options, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { logSQL } from '../utils/sqlUtils.js';
import { App } from './App.js';
import { AppBlockStyle } from './AppBlockStyle.js';
import { AppMember } from './AppMember.js';
import { AppMessages } from './AppMessages.js';
import { AppOAuth2Authorization } from './AppOAuth2Authorization.js';
import { AppOAuth2Secret } from './AppOAuth2Secret.js';
import { AppRating } from './AppRating.js';
import { AppSamlAuthorization } from './AppSamlAuthorization.js';
import { AppSamlSecret } from './AppSamlSecret.js';
import { AppScreenshot } from './AppScreenshot.js';
import { AppSnapshot } from './AppSnapshot.js';
import { AppSubscription } from './AppSubscription.js';
import { Asset } from './Asset.js';
import { BlockAsset } from './BlockAsset.js';
import { BlockMessages } from './BlockMessages.js';
import { BlockVersion } from './BlockVersion.js';
import { EmailAuthorization } from './EmailAuthorization.js';
import { Member } from './Member.js';
import { Meta } from './Meta.js';
import { OAuth2AuthorizationCode } from './OAuth2AuthorizationCode.js';
import { OAuth2ClientCredentials } from './OAuth2ClientCredentials.js';
import { OAuthAuthorization } from './OAuthAuthorization.js';
import { Organization } from './Organization.js';
import { OrganizationInvite } from './OrganizationInvite.js';
import { ResetPasswordToken } from './ResetPasswordToken.js';
import { Resource } from './Resource.js';
import { ResourceSubscription } from './ResourceSubscription.js';
import { ResourceVersion } from './ResourceVersion.js';
import { SamlLoginRequest } from './SamlLoginRequest.js';
import { Team } from './Team.js';
import { TeamInvite } from './TeamInvite.js';
import { TeamMember } from './TeamMember.js';
import { Theme } from './Theme.js';
import { User } from './User.js';

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

export {
  App,
  AppBlockStyle,
  AppMember,
  AppOAuth2Authorization,
  AppOAuth2Secret,
  AppRating,
  AppSamlAuthorization,
  AppSamlSecret,
  AppScreenshot,
  AppSnapshot,
  AppSubscription,
  AppMessages,
  Asset,
  BlockAsset,
  BlockMessages,
  BlockVersion,
  EmailAuthorization,
  Member,
  Meta,
  OAuth2AuthorizationCode,
  OAuth2ClientCredentials,
  OAuthAuthorization,
  Organization,
  OrganizationInvite,
  ResetPasswordToken,
  Resource,
  ResourceVersion,
  ResourceSubscription,
  Team,
  TeamInvite,
  TeamMember,
  Theme,
  SamlLoginRequest,
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

  const options = {
    logging: logSQL,
    retry: { max: 3 },
    models: [
      App,
      AppBlockStyle,
      AppMember,
      AppOAuth2Authorization,
      AppOAuth2Secret,
      AppRating,
      AppSamlAuthorization,
      AppSamlSecret,
      AppScreenshot,
      AppSnapshot,
      AppSubscription,
      AppMessages,
      Asset,
      BlockAsset,
      BlockMessages,
      BlockVersion,
      EmailAuthorization,
      Member,
      Meta,
      OAuth2AuthorizationCode,
      OAuth2ClientCredentials,
      OAuthAuthorization,
      Organization,
      OrganizationInvite,
      ResetPasswordToken,
      Resource,
      ResourceSubscription,
      ResourceVersion,
      Team,
      TeamInvite,
      TeamMember,
      Theme,
      SamlLoginRequest,
      User,
    ],
  };
  const args: [Options] | [string, Options] = uri
    ? [uri, options]
    : [
        Object.assign(options, {
          dialect: 'postgres' as const,
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
  db = new Sequelize(...(args as [Options]));

  return db;
}

export function getDB(): Sequelize {
  if (!db) {
    throw new Error('The database hasn’t been initialized yet. Call initDB() first.');
  }
  return db;
}

/**
 * Run queries in a transaction.
 *
 * If the callback function fails, the transaction will be rolled back.
 *
 * @param callback The function that will be called with a transaction.
 * @returns The result of the callback function.
 */
export function transactional<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T> {
  return getDB().transaction(callback);
}

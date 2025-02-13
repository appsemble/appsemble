import { type Options, type Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { App } from './App.js';
import { AppBlockStyle } from './AppBlockStyle.js';
import { AppCollection } from './AppCollection.js';
import { AppCollectionApp } from './AppCollectionApp.js';
import { AppEmailQuotaLog } from './AppEmailQuotaLog.js';
import { AppInvite } from './AppInvite.js';
import { AppMember } from './AppMember.js';
import { AppMessages } from './AppMessages.js';
import { AppOAuth2Authorization } from './AppOAuth2Authorization.js';
import { AppOAuth2Secret } from './AppOAuth2Secret.js';
import { AppRating } from './AppRating.js';
import { AppReadme } from './AppReadme.js';
import { AppSamlAuthorization } from './AppSamlAuthorization.js';
import { AppSamlSecret } from './AppSamlSecret.js';
import { AppScreenshot } from './AppScreenshot.js';
import { AppServiceSecret } from './AppServiceSecret.js';
import { AppSnapshot } from './AppSnapshot.js';
import { AppSubscription } from './AppSubscription.js';
import { AppVariable } from './AppVariable.js';
import { Asset } from './Asset.js';
import { BlockAsset } from './BlockAsset.js';
import { BlockMessages } from './BlockMessages.js';
import { BlockVersion } from './BlockVersion.js';
import { EmailAuthorization } from './EmailAuthorization.js';
import { Group } from './Group.js';
import { GroupInvite } from './GroupInvite.js';
import { GroupMember } from './GroupMember.js';
import { Meta } from './Meta.js';
import { OAuth2AuthorizationCode } from './OAuth2AuthorizationCode.js';
import { OAuth2ClientCredentials } from './OAuth2ClientCredentials.js';
import { OAuthAuthorization } from './OAuthAuthorization.js';
import { Organization } from './Organization.js';
import { OrganizationInvite } from './OrganizationInvite.js';
import { OrganizationMember } from './OrganizationMember.js';
import { ResetPasswordToken } from './ResetPasswordToken.js';
import { Resource } from './Resource.js';
import { ResourceSubscription } from './ResourceSubscription.js';
import { ResourceVersion } from './ResourceVersion.js';
import { SamlLoginRequest } from './SamlLoginRequest.js';
import { Theme } from './Theme.js';
import { Training } from './Training.js';
import { TrainingCompleted } from './TrainingCompleted.js';
import { User } from './User.js';
import { logSQL } from '../utils/sqlUtils.js';

let db: Sequelize;
const schemas: Record<string, Sequelize> = {};

export interface InitDBParams {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  uri?: string;
  ssl?: boolean;
  schema?: string;
}

export {
  App,
  AppServiceSecret,
  AppBlockStyle,
  AppCollection,
  AppCollectionApp,
  AppEmailQuotaLog,
  AppInvite,
  AppMember,
  AppOAuth2Authorization,
  AppOAuth2Secret,
  AppRating,
  AppReadme,
  AppSamlAuthorization,
  AppSamlSecret,
  AppScreenshot,
  AppSnapshot,
  AppSubscription,
  AppVariable,
  AppMessages,
  Asset,
  BlockAsset,
  BlockMessages,
  BlockVersion,
  EmailAuthorization,
  Meta,
  OAuth2AuthorizationCode,
  OAuth2ClientCredentials,
  OAuthAuthorization,
  Organization,
  OrganizationInvite,
  OrganizationMember,
  ResetPasswordToken,
  Resource,
  ResourceVersion,
  ResourceSubscription,
  Group,
  GroupInvite,
  GroupMember,
  Theme,
  SamlLoginRequest,
  User,
  Training,
  TrainingCompleted,
};

export function initDB({
  database,
  host = process.env.NODE_ENV === 'production' ? 'postgres' : 'localhost',
  password,
  port,
  schema,
  ssl = false,
  uri,
  username,
}: InitDBParams): Sequelize {
  if (schema && schemas[schema]) {
    throw new Error(
      'initDB() was called multiple times within the same context with the same schema.',
    );
  } else if (db) {
    throw new Error('initDB() was called multiple times within the same context.');
  }

  const options = {
    logging: logSQL,
    retry: { max: 3 },
    models: [
      App,
      AppServiceSecret,
      AppBlockStyle,
      AppCollection,
      AppCollectionApp,
      AppEmailQuotaLog,
      AppInvite,
      AppMember,
      AppOAuth2Authorization,
      AppOAuth2Secret,
      AppRating,
      AppReadme,
      AppSamlAuthorization,
      AppSamlSecret,
      AppScreenshot,
      AppSnapshot,
      AppSubscription,
      AppVariable,
      AppMessages,
      Asset,
      BlockAsset,
      BlockMessages,
      BlockVersion,
      EmailAuthorization,
      Meta,
      OAuth2AuthorizationCode,
      OAuth2ClientCredentials,
      OAuthAuthorization,
      Organization,
      OrganizationInvite,
      OrganizationMember,
      ResetPasswordToken,
      Resource,
      ResourceSubscription,
      ResourceVersion,
      Group,
      GroupInvite,
      GroupMember,
      Theme,
      SamlLoginRequest,
      User,
      Training,
      TrainingCompleted,
    ],
    ...(schema
      ? {
          dialectOptions: {
            prependSearchPath: true,
          },
          searchPath: schema,
        }
      : {}),
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

  if (schema) {
    schemas[schema] = new Sequelize(...(args as [Options]));
    return schemas[schema];
  }

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

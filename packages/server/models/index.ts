import { logger } from '@appsemble/node-utils';
import { type Options, type Sequelize as RootSequelize, type Transaction } from 'sequelize';
import { type Repository, Sequelize } from 'sequelize-typescript';

import {
  type AppBlockStyleGlobal as AppBlockStyle,
  createAppBlockStyleModel,
} from './apps/AppBlockStyle.js';
import { type AppInviteGlobal as AppInvite, createAppInviteModel } from './apps/AppInvite.js';
import { type AppMemberGlobal as AppMember, createAppMemberModel } from './apps/AppMember.js';
import {
  type AppMemberEmailAuthorizationGlobal as AppMemberEmailAuthorization,
  createAppMemberEmailAuthorizationModel,
} from './apps/AppMemberEmailAuthorization.js';
import { type AppMetaGlobal as AppMeta, createAppMetaModel } from './apps/AppMeta.js';
import {
  type AppOAuth2AuthorizationGlobal as AppOAuth2Authorization,
  createAppOAuth2AuthorizationModel,
} from './apps/AppOAuth2Authorization.js';
import {
  type AppOAuth2SecretGlobal as AppOAuth2Secret,
  createAppOAuth2SecretModel,
} from './apps/AppOAuth2Secret.js';
import {
  type AppSamlAuthorizationGlobal as AppSamlAuthorization,
  createAppSamlAuthorizationModel,
} from './apps/AppSamlAuthorization.js';
import {
  type AppSamlSecretGlobal as AppSamlSecret,
  createAppSamlSecretModel,
} from './apps/AppSamlSecret.js';
import {
  type AppServiceSecretGlobal as AppServiceSecret,
  createAppServiceSecretModel,
} from './apps/AppServiceSecret.js';
import {
  type AppSubscriptionGlobal as AppSubscription,
  createAppSubscriptionModel,
} from './apps/AppSubscription.js';
import {
  type AppVariableGlobal as AppVariable,
  createAppVariableModel,
} from './apps/AppVariable.js';
import {
  type AppWebhookSecretGlobal as AppWebhookSecret,
  createAppWebhookSecretModel,
} from './apps/AppWebhookSecret.js';
import { type AssetGlobal as Asset, createAssetModel } from './apps/Asset.js';
import { createGroupModel, type GroupGlobal as Group } from './apps/Group.js';
import {
  createGroupInviteModel,
  type GroupInviteGlobal as GroupInvite,
} from './apps/GroupInvite.js';
import {
  createGroupMemberModel,
  type GroupMemberGlobal as GroupMember,
} from './apps/GroupMember.js';
import {
  createOAuth2AuthorizationCodeModel,
  type OAuth2AuthorizationCodeGlobal as OAuth2AuthorizationCode,
} from './apps/OAuth2AuthorizationCode.js';
import { createResourceModel, type ResourceGlobal as Resource } from './apps/Resource.js';
import {
  createResourceSubscriptionModel,
  type ResourceSubscriptionGlobal as ResourceSubscription,
} from './apps/ResourceSubscription.js';
import {
  createResourceVersionModel,
  type ResourceVersionGlobal as ResourceVersion,
} from './apps/ResourceVersion.js';
import {
  createSamlLoginRequestModel,
  type SamlLoginRequestGlobal as SamlLoginRequest,
} from './apps/SamlLoginRequest.js';
import { App } from './main/App.js';
import { AppCollection } from './main/AppCollection.js';
import { AppCollectionApp } from './main/AppCollectionApp.js';
import { AppEmailQuotaLog } from './main/AppEmailQuotaLog.js';
import { AppMessages } from './main/AppMessages.js';
import { AppRating } from './main/AppRating.js';
import { AppReadme } from './main/AppReadme.js';
import { AppScreenshot } from './main/AppScreenshot.js';
import { AppSnapshot } from './main/AppSnapshot.js';
import { BlockAsset } from './main/BlockAsset.js';
import { BlockMessages } from './main/BlockMessages.js';
import { BlockVersion } from './main/BlockVersion.js';
import { Coupon } from './main/Coupon.js';
import { EmailAuthorization } from './main/EmailAuthorization.js';
import { Invoice } from './main/Invoice.js';
import { InvoiceTransaction } from './main/InvoiceTransaction.js';
import { Meta } from './main/Meta.js';
import { OAuth2ClientCredentials } from './main/OAuth2ClientCredentials.js';
import { OAuthAuthorization } from './main/OAuthAuthorization.js';
import { Organization } from './main/Organization.js';
import { OrganizationInvite } from './main/OrganizationInvite.js';
import { OrganizationMember } from './main/OrganizationMember.js';
import { OrganizationSubscription } from './main/OrganizationSubscription.js';
import { ResetPasswordToken } from './main/ResetPasswordToken.js';
import { Theme } from './main/Theme.js';
import { Training } from './main/Training.js';
import { TrainingCompleted } from './main/TrainingCompleted.js';
import { User } from './main/User.js';
import { migrations } from '../migrations/apps/index.js';
import { argv } from '../utils/argv.js';
import { decrypt } from '../utils/crypto.js';
import { migrate } from '../utils/migrate.js';
import { handleDBError, logSQL } from '../utils/sqlUtils.js';

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
  type AppMember,
  type AppServiceSecret,
  type AppBlockStyle,
  AppCollection,
  AppCollectionApp,
  AppEmailQuotaLog,
  type AppInvite,
  type AppOAuth2Authorization,
  type AppOAuth2Secret,
  type AppMemberEmailAuthorization,
  AppRating,
  AppReadme,
  type AppSamlAuthorization,
  type AppSamlSecret,
  AppScreenshot,
  AppSnapshot,
  type AppSubscription,
  type AppVariable,
  AppMessages,
  type AppWebhookSecret,
  type Asset,
  BlockAsset,
  BlockMessages,
  BlockVersion,
  Coupon,
  EmailAuthorization,
  Meta,
  type OAuth2AuthorizationCode,
  OAuth2ClientCredentials,
  OAuthAuthorization,
  Organization,
  OrganizationInvite,
  OrganizationMember,
  ResetPasswordToken,
  type ResourceVersion,
  OrganizationSubscription,
  Invoice,
  InvoiceTransaction,
  type ResourceSubscription,
  type Group,
  type GroupInvite,
  type GroupMember,
  Theme,
  type SamlLoginRequest,
  User,
  Training,
  TrainingCompleted,
  type Resource,
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
      AppCollection,
      AppCollectionApp,
      AppEmailQuotaLog,
      AppRating,
      AppReadme,
      AppScreenshot,
      AppSnapshot,
      AppMessages,
      BlockAsset,
      BlockMessages,
      BlockVersion,
      Coupon,
      OrganizationSubscription,
      Invoice,
      InvoiceTransaction,
      EmailAuthorization,
      Meta,
      OAuth2ClientCredentials,
      OAuthAuthorization,
      Organization,
      OrganizationInvite,
      OrganizationMember,
      ResetPasswordToken,
      Theme,
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

export interface AppModels {
  AppBlockStyle: Repository<AppBlockStyle>;
  AppInvite: Repository<AppInvite>;
  AppMember: Repository<AppMember>;
  AppMemberEmailAuthorization: Repository<AppMemberEmailAuthorization>;
  AppOAuth2Authorization: Repository<AppOAuth2Authorization>;
  AppOAuth2Secret: Repository<AppOAuth2Secret>;
  AppSamlAuthorization: Repository<AppSamlAuthorization>;
  AppSamlSecret: Repository<AppSamlSecret>;
  AppServiceSecret: Repository<AppServiceSecret>;
  AppSubscription: Repository<AppSubscription>;
  AppVariable: Repository<AppVariable>;
  AppWebhookSecret: Repository<AppWebhookSecret>;
  Asset: Repository<Asset>;
  Group: Repository<Group>;
  GroupInvite: Repository<GroupInvite>;
  GroupMember: Repository<GroupMember>;
  Meta: Repository<AppMeta>;
  OAuth2AuthorizationCode: Repository<OAuth2AuthorizationCode>;
  Resource: Repository<Resource>;
  ResourceSubscription: Repository<ResourceSubscription>;
  ResourceVersion: Repository<ResourceVersion>;
  SamlLoginRequest: Repository<SamlLoginRequest>;
}

export interface AppDB extends AppModels {
  sequelize: Sequelize;
}

const appDBs: Record<number, AppDB | null> = {};

export async function initAppDB(
  appId: number,
  rootDB?: RootSequelize,
  transaction?: Transaction,
  replace?: boolean,
): Promise<void> {
  const mainDB = rootDB ?? getDB();

  if (appDBs[appId] && !replace) {
    throw new Error('initAppDB() was called multiple times within the same context.');
  }

  const app = (await mainDB.models.App.findOne({
    attributes: ['id', 'dbName', 'dbHost', 'dbPort', 'dbUser', 'dbPassword', 'definition'],
    where: { id: appId },
    transaction,
  })) as App;

  if (!app) {
    throw new Error('App not found');
  }

  const appDBName = app.dbName || `app-${app.id}`;

  if (app.dbHost === (argv.databaseHost || process.env.DATABASE_HOST || 'localhost')) {
    // The database should be dynamically created and managed by appsemble
    try {
      const [[{ exists }]] = (await mainDB.query(
        `SELECT EXISTS (SELECT FROM pg_database WHERE datname = '${appDBName}');`,
      )) as { exists: boolean }[][];

      if (!exists) {
        const [[{ exists: templateExists }]] = (await mainDB.query(
          "SELECT EXISTS (SELECT FROM pg_database WHERE datname = 'app_template');",
        )) as { exists: boolean }[][];

        await mainDB.query(
          `CREATE DATABASE "${appDBName}" ${templateExists ? 'WITH TEMPLATE app_template' : ''}`,
        );
      }
    } catch (err) {
      logger.error(err);
    }
  }

  let appDB;
  try {
    appDB = new Sequelize({
      database: appDBName,
      host: app.dbHost,
      port: app.dbPort,
      password: decrypt(app.dbPassword, argv.aesSecret || 'Local Appsemble development AES secret'),
      username: app.dbUser,
      logging: logSQL,
      dialect: 'postgres',
      dialectOptions: {
        ssl: argv.databaseSsl && { rejectUnauthorized: false },
      },
    });

    const models: AppModels = {
      AppBlockStyle: createAppBlockStyleModel(appDB),
      AppInvite: createAppInviteModel(appDB),
      AppMember: createAppMemberModel(appDB),
      AppMemberEmailAuthorization: createAppMemberEmailAuthorizationModel(appDB),
      Meta: createAppMetaModel(appDB),
      AppOAuth2Authorization: createAppOAuth2AuthorizationModel(appDB),
      AppOAuth2Secret: createAppOAuth2SecretModel(appDB),
      AppSamlAuthorization: createAppSamlAuthorizationModel(appDB),
      AppSamlSecret: createAppSamlSecretModel(appDB),
      AppServiceSecret: createAppServiceSecretModel(appDB),
      AppSubscription: createAppSubscriptionModel(appDB),
      AppVariable: createAppVariableModel(appDB),
      AppWebhookSecret: createAppWebhookSecretModel(appDB),
      Asset: createAssetModel(appDB),
      Group: createGroupModel(appDB),
      GroupInvite: createGroupInviteModel(appDB),
      GroupMember: createGroupMemberModel(appDB),
      OAuth2AuthorizationCode: createOAuth2AuthorizationCodeModel(appDB),
      Resource: createResourceModel(appDB),
      ResourceSubscription: createResourceSubscriptionModel(appDB),
      ResourceVersion: createResourceVersionModel(appDB),
      SamlLoginRequest: createSamlLoginRequestModel(appDB),
    };

    for (const model of Object.values(models)) {
      if (typeof model.associate === 'function') {
        model.associate(models);
      }
      if (typeof model.addHooks === 'function') {
        model.addHooks(models, app.toJSON());
      }
    }

    await migrate(appDB, argv.migrateTo ?? 'next', migrations);

    appDBs[appId] = {
      sequelize: appDB,
      ...models,
    };
  } catch (error) {
    handleDBError(error as Error);
  }
}

export async function getAppDB(
  appId: number,
  rootDB?: RootSequelize,
  transaction?: Transaction,
  replace?: boolean,
): Promise<AppDB> {
  if (appDBs[appId] == null || replace === true) {
    await initAppDB(appId, rootDB, transaction, replace);
  }

  return appDBs[appId]!;
}

export async function dropAndCloseAllAppDBs(): Promise<void> {
  await Promise.all(
    Object.entries(appDBs).map(async ([appId, appDB]) => {
      const sequelize = appDB?.sequelize;
      if (!sequelize) {
        return;
      }
      await sequelize.getQueryInterface().dropAllTables();
      await sequelize.close();
      appDBs[Number(appId)] = null;
    }),
  );
}

import { logger } from '@appsemble/node-utils';
import { type Options, type Sequelize as RootSequelize, type Transaction } from 'sequelize';
import { type Repository, Sequelize } from 'sequelize-typescript';

import {
  type AppBlockStyleGlobal as AppBlockStyle,
  createAppBlockStyleModel,
} from './apps/AppBlockStyle.js';
import { type AppInviteGlobal as AppInvite, createAppInviteModel } from './apps/AppInvite.js';
import { type AppMemberGlobal as AppMember, createAppMemberModel } from './apps/AppMember.js';
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
import { EmailAuthorization } from './main/EmailAuthorization.js';
import { Meta } from './main/Meta.js';
import { OAuth2ClientCredentials } from './main/OAuth2ClientCredentials.js';
import { OAuthAuthorization } from './main/OAuthAuthorization.js';
import { Organization } from './main/Organization.js';
import { OrganizationInvite } from './main/OrganizationInvite.js';
import { OrganizationMember } from './main/OrganizationMember.js';
import { ResetPasswordToken } from './main/ResetPasswordToken.js';
import { Theme } from './main/Theme.js';
import { Training } from './main/Training.js';
import { TrainingCompleted } from './main/TrainingCompleted.js';
import { User } from './main/User.js';
import { migrations } from '../migrations/apps/index.js';
import { argv } from '../utils/argv.js';
import { migrate } from '../utils/migrate.js';
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
  type AppMember,
  type AppServiceSecret,
  type AppBlockStyle,
  AppCollection,
  AppCollectionApp,
  AppEmailQuotaLog,
  type AppInvite,
  type AppOAuth2Authorization,
  type AppOAuth2Secret,
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

export async function initAppDB(appId: number, rootDB?: RootSequelize): Promise<void> {
  if (!appId) {
    throw new Error('Missing app id');
  }

  if (appDBs[appId]) {
    throw new Error('initAppDB() was called multiple times within the same context.');
  }

  const app = await App.findByPk(appId);

  if (!app) {
    throw new Error('App not found');
  }

  const mainDB = rootDB ?? getDB();

  try {
    const [[{ exists }]] = (await mainDB.query(
      `SELECT EXISTS (SELECT FROM pg_database WHERE datname = 'app-${appId}');`,
    )) as { exists: boolean }[][];
    if (!exists) {
      await mainDB.query(`CREATE DATABASE "app-${appId}"`);
    }
  } catch (err) {
    logger.error(err);
  }

  // TODO get app db params from the fetched app
  const sequelize = new Sequelize({
    database: `app-${appId}`,
    host: mainDB.config.host ?? 'localhost',
    port: Number(mainDB.config.port ?? 5432),
    password: mainDB.config.password ?? 'password',
    username: mainDB.config.username ?? 'admin',
    ssl: false,
    logging: logSQL,
    dialect: 'postgres',
  });

  const models: AppModels = {
    AppBlockStyle: createAppBlockStyleModel(sequelize),
    AppInvite: createAppInviteModel(sequelize),
    AppMember: createAppMemberModel(sequelize),
    Meta: createAppMetaModel(sequelize),
    AppOAuth2Authorization: createAppOAuth2AuthorizationModel(sequelize),
    AppOAuth2Secret: createAppOAuth2SecretModel(sequelize),
    AppSamlAuthorization: createAppSamlAuthorizationModel(sequelize),
    AppSamlSecret: createAppSamlSecretModel(sequelize),
    AppServiceSecret: createAppServiceSecretModel(sequelize),
    AppSubscription: createAppSubscriptionModel(sequelize),
    AppVariable: createAppVariableModel(sequelize),
    AppWebhookSecret: createAppWebhookSecretModel(sequelize),
    Asset: createAssetModel(sequelize),
    Group: createGroupModel(sequelize),
    GroupInvite: createGroupInviteModel(sequelize),
    GroupMember: createGroupMemberModel(sequelize),
    OAuth2AuthorizationCode: createOAuth2AuthorizationCodeModel(sequelize),
    Resource: createResourceModel(sequelize),
    ResourceSubscription: createResourceSubscriptionModel(sequelize),
    ResourceVersion: createResourceVersionModel(sequelize),
    SamlLoginRequest: createSamlLoginRequestModel(sequelize),
  };

  for (const model of Object.values(models)) {
    if (typeof model.associate === 'function') {
      model.associate(models);
    }
    if (typeof model.addHooks === 'function') {
      model.addHooks(models, app.toJSON());
    }
  }

  await migrate(sequelize, argv.migrateTo ?? 'next', migrations);

  appDBs[appId] = {
    sequelize,
    ...models,
  };
}

export async function getAppDB(appId: number, rootDB?: RootSequelize): Promise<AppDB> {
  if (!appId) {
    throw new Error('Missing app id');
  }

  if (appDBs[appId] == null) {
    await initAppDB(appId, rootDB);
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

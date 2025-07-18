import { type Remapper } from '@appsemble/lang-sdk';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  DefaultScope,
  Model,
  PrimaryKey,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { type AppModels, type AppOAuth2Authorization } from '../index.js';

export class AppOAuth2SecretGlobal extends Model {
  id!: number;

  authorizationUrl!: string;

  tokenUrl!: string;

  userInfoUrl?: string;

  remapper?: Remapper;

  clientId!: string;

  clientSecret!: string;

  icon!: IconName;

  name!: string;

  scope!: string;

  created!: Date;

  updated!: Date;

  AppOAuth2Authorizations!: AppOAuth2Authorization[];
}

export function createAppOAuth2SecretModel(sequelize: Sequelize): typeof AppOAuth2SecretGlobal {
  @DefaultScope(() => ({
    attributes: [
      'authorizationUrl',
      'clientId',
      'clientSecret',
      'created',
      'icon',
      'id',
      'name',
      'remapper',
      'scope',
      'tokenUrl',
      'updated',
      'userInfoUrl',
    ],
  }))
  @Table({ tableName: 'AppOAuth2Secret' })
  class AppOAuth2Secret extends AppOAuth2SecretGlobal {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number;

    @AllowNull(false)
    @Column(DataType.STRING)
    authorizationUrl!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    tokenUrl!: string;

    @Column(DataType.STRING)
    userInfoUrl?: string;

    @Column(DataType.JSON)
    remapper?: Remapper;

    @AllowNull(false)
    @Column(DataType.STRING)
    clientId!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    clientSecret!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    icon!: IconName;

    @AllowNull(false)
    @Column(DataType.STRING)
    name!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    scope!: string;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;

    static associate(models: AppModels): void {
      AppOAuth2Secret.hasMany(models.AppOAuth2Authorization, { onDelete: 'CASCADE' });
    }
  }

  sequelize.addModels([AppOAuth2Secret]);
  return AppOAuth2Secret;
}

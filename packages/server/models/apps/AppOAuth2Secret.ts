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
  declare id: number;

  declare authorizationUrl: string;

  declare tokenUrl: string;

  declare userInfoUrl?: string;

  declare remapper?: Remapper;

  declare clientId: string;

  declare clientSecret: string;

  declare icon: IconName;

  declare name: string;

  declare scope: string;

  declare created: Date;

  declare updated: Date;

  declare AppOAuth2Authorizations: AppOAuth2Authorization[];
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
    declare id: number;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare authorizationUrl: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare tokenUrl: string;

    @Column(DataType.STRING)
    declare userInfoUrl?: string;

    @Column(DataType.JSON)
    declare remapper?: Remapper;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare clientId: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare clientSecret: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare icon: IconName;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare name: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare scope: string;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;

    static associate(models: AppModels): void {
      AppOAuth2Secret.hasMany(models.AppOAuth2Authorization, { onDelete: 'CASCADE' });
    }
  }

  sequelize.addModels([AppOAuth2Secret]);
  return AppOAuth2Secret;
}

import { type Remapper } from '@appsemble/lang-sdk';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DefaultScope,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, AppOAuth2Authorization } from './index.js';

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
export class AppOAuth2Secret extends Model {
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

  /**
   * The id of the app this secret is linked to.
   */
  @ForeignKey(() => App)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  AppId!: number;

  @BelongsTo(() => App)
  App?: Awaited<App>;

  @HasMany(() => AppOAuth2Authorization, { onDelete: 'CASCADE' })
  AppOAuth2Authorizations!: AppOAuth2Authorization[];
}

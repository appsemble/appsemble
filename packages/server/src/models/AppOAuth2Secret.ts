import type { AppOAuth2Secret as Interface } from '@appsemble/types';
import type { IconName } from '@fortawesome/fontawesome-common-types';
import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App } from '.';

@Table({ tableName: 'AppOAuth2Secret' })
export default class AppOAuth2Secret extends Model<AppOAuth2Secret> implements Interface {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  authorizationUrl: string;

  @Column
  tokenUrl: string;

  @Column
  userInfoUrl: string;

  @Column
  clientId: string;

  @Column
  clientSecret: string;

  @Column(DataType.STRING)
  icon: IconName;

  @Column
  name: string;

  @Column
  scope: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  /**
   * The id of the app this secret is linked to.
   */
  @ForeignKey(() => App)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: App;
}

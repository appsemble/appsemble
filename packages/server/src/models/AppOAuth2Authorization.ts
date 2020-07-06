import {
  AllowNull,
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

import { User } from '.';
import AppOAuth2Secret from './AppOAuth2Secret';

@Table({ tableName: 'AppOAuth2Authorization' })
export default class AppOAuth2Authorization extends Model<AppOAuth2Authorization> {
  /**
   * The subject id of the user on the remote authorization server.
   */
  @PrimaryKey
  @Column
  sub: string;

  @PrimaryKey
  @ForeignKey(() => AppOAuth2Secret)
  @Column
  AppOAuth2SecretId: number;

  @BelongsTo(() => AppOAuth2Secret)
  AppOAuth2Secret: AppOAuth2Secret;

  /**
   * The access token assigned to Appsemble linked to the subject.
   */
  @AllowNull(false)
  @Column(DataType.TEXT)
  accessToken: string;

  /**
   * The expiration date of the access token.
   */
  @Column
  expiresAt: Date;

  /**
   * The refresh token that may be used to refresh the access token.
   */
  @Column(DataType.TEXT)
  refreshToken: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  /**
   * The id of the linked Appsemble user.
   */
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  UserId: string;

  /**
   * The Appsemble user.
   */
  @BelongsTo(() => User)
  User: User;
}

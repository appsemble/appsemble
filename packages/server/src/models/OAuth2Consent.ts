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

import { App, User } from '.';

/**
 * A consent given by the user which grant an app specific scopes.
 */
@Table({ tableName: 'OAuth2Consent' })
export class OAuth2Consent extends Model {
  /**
   * The id of the app the OAuth2 consent is for.
   */
  @PrimaryKey
  @AllowNull(false)
  @ForeignKey(() => App)
  @Column
  AppId: number;

  /**
   * The id of the user the OAuth2 consent is for.
   */
  @PrimaryKey
  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId: string;

  /**
   * The scopes the user has agreed to.
   */
  @AllowNull(false)
  @Column
  scope: string;

  /**
   * The app the OAuth2 consent is for.
   */
  @BelongsTo(() => App)
  App: App;

  /**
   * The user the OAuth2 consent is for.
   */
  @BelongsTo(() => User)
  User: User;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}

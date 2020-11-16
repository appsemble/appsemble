import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { AppSamlSecret, User } from '.';

@Table({ tableName: 'SamlLoginRequest', paranoid: false })
export class SamlLoginRequest extends Model<SamlLoginRequest> {
  /**
   * The SAML login ID that is sent to the SAML server.
   */
  @PrimaryKey
  @Column
  id: string;

  /**
   * The OAuth2 scope the app requested in the login request.
   */
  @Column
  scope: string;

  /**
   * The OAuth2 state the app specified in the login request.
   */
  @Column
  state: string;

  /**
   * The OAuth2 redirect URI the app specified in the login request.
   */
  @Column
  redirectUri: string;

  /**
   * The ID of the app’s SAML secret.
   */
  @ForeignKey(() => AppSamlSecret)
  @AllowNull(false)
  @Column
  AppSamlSecretId: number;

  /**
   * The app’s SAML secret.
   */
  @BelongsTo(() => AppSamlSecret)
  AppSamlSecret: AppSamlSecret;

  /**
   * An optional ID of the user who’s logged in to Appsemble Studio at the time of the request.
   */
  @ForeignKey(() => User)
  @Column
  UserId: string;

  /**
   * An optional user who’s logged in to Appsemble Studio at the time of the request.
   */
  @BelongsTo(() => User)
  User: User;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}

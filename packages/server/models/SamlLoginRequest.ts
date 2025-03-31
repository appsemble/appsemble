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

import { AppMember, AppSamlSecret } from './index.js';

@Table({ tableName: 'SamlLoginRequest' })
export class SamlLoginRequest extends Model {
  /**
   * The SAML login ID that is sent to the SAML server.
   */
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string;

  /**
   * The OAuth2 scope the app requested in the login request.
   */
  @AllowNull(false)
  @Column(DataType.STRING)
  scope!: string;

  /**
   * The OAuth2 state the app specified in the login request.
   */
  @AllowNull(false)
  @Column(DataType.STRING)
  state!: string;

  /**
   * The email address the user is linking.
   */
  @Column(DataType.STRING)
  email?: string;

  /**
   * The nameId that’s stored if the authorization is being linked to the user.
   */
  @Column(DataType.STRING)
  nameId?: string;

  /**
   * The OAuth2 redirect URI the app specified in the login request.
   */
  @AllowNull(false)
  @Column(DataType.STRING)
  redirectUri!: string;

  /**
   * The timezone of the browser used during the login flow.
   */
  @AllowNull(false)
  @Column(DataType.STRING)
  timezone!: string;

  /**
   * The ID of the app’s SAML secret.
   */
  @ForeignKey(() => AppSamlSecret)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  AppSamlSecretId!: number;

  /**
   * The app’s SAML secret.
   */
  @BelongsTo(() => AppSamlSecret, { onDelete: 'CASCADE' })
  AppSamlSecret?: Awaited<AppSamlSecret>;

  /**
   * An optional ID of the user who’s logged in to Appsemble Studio at the time of the request.
   */
  @ForeignKey(() => AppMember)
  @Column(DataType.UUID)
  AppMemberId?: string;

  /**
   * An optional user who’s logged in to Appsemble Studio at the time of the request.
   */
  @BelongsTo(() => AppMember, { onDelete: 'CASCADE' })
  AppMember?: Awaited<AppMember>;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;
}

import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { type AppMember, type AppModels, type AppSamlSecret } from '../index.js';

export class SamlLoginRequestGlobal extends Model {
  /**
   * The SAML login ID that is sent to the SAML server.
   */
  id!: string;

  /**
   * The OAuth2 scope the app requested in the login request.
   */
  scope!: string;

  /**
   * The OAuth2 state the app specified in the login request.
   */
  state!: string;

  /**
   * The email address the user is linking.
   */
  email?: string;

  /**
   * The nameId that’s stored if the authorization is being linked to the user.
   */
  nameId?: string;

  /**
   * The OAuth2 redirect URI the app specified in the login request.
   */
  redirectUri!: string;

  /**
   * The timezone of the browser used during the login flow.
   */
  timezone!: string;

  created!: Date;

  updated!: Date;

  /**
   * The ID of the app’s SAML secret.
   */
  AppSamlSecretId!: number;

  /**
   * An optional ID of the user who’s logged in to Appsemble Studio at the time of the request.
   */
  AppMemberId?: string;

  /**
   * The app’s SAML secret.
   */
  AppSamlSecret?: Awaited<AppSamlSecret>;

  /**
   * An optional user who’s logged in to Appsemble Studio at the time of the request.
   */
  AppMember?: Awaited<AppMember>;
}

export function createSamlLoginRequestModel(sequelize: Sequelize): typeof SamlLoginRequestGlobal {
  @Table({ tableName: 'SamlLoginRequest' })
  class SamlLoginRequest extends SamlLoginRequestGlobal {
    @PrimaryKey
    @Column(DataType.STRING)
    id!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    scope!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    state!: string;

    @Column(DataType.STRING)
    email?: string;

    @Column(DataType.STRING)
    nameId?: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    redirectUri!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    timezone!: string;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    AppSamlSecretId!: number;

    @Column(DataType.UUID)
    AppMemberId?: string;

    static associate(models: AppModels): void {
      SamlLoginRequest.belongsTo(models.AppSamlSecret, {
        foreignKey: 'AppSamlSecretId',
        onDelete: 'CASCADE',
      });
      SamlLoginRequest.belongsTo(models.AppMember, {
        foreignKey: 'AppMemberId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  }

  sequelize.addModels([SamlLoginRequest]);
  return SamlLoginRequest;
}

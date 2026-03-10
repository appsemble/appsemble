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
  declare id: string;

  /**
   * The OAuth2 scope the app requested in the login request.
   */
  declare scope: string;

  /**
   * The OAuth2 state the app specified in the login request.
   */
  declare state: string;

  /**
   * The email address the user is linking.
   */
  declare email?: string;

  /**
   * The nameId that's stored if the authorization is being linked to the user.
   */
  declare nameId?: string;

  /**
   * The OAuth2 redirect URI the app specified in the login request.
   */
  declare redirectUri: string;

  /**
   * The timezone of the browser used during the login flow.
   */
  declare timezone: string;

  declare created: Date;

  declare updated: Date;

  /**
   * The ID of the app's SAML secret.
   */
  declare AppSamlSecretId: number;

  /**
   * An optional ID of the user who's logged in to Appsemble Studio at the time of the request.
   */
  declare AppMemberId?: string;

  /**
   * The app's SAML secret.
   */
  declare AppSamlSecret?: Awaited<AppSamlSecret>;

  /**
   * An optional user who's logged in to Appsemble Studio at the time of the request.
   */
  declare AppMember?: Awaited<AppMember>;
}

export function createSamlLoginRequestModel(sequelize: Sequelize): typeof SamlLoginRequestGlobal {
  @Table({ tableName: 'SamlLoginRequest' })
  class SamlLoginRequest extends SamlLoginRequestGlobal {
    @PrimaryKey
    @Column(DataType.STRING)
    declare id: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare scope: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare state: string;

    @Column(DataType.STRING)
    declare email?: string;

    @Column(DataType.STRING)
    declare nameId?: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare redirectUri: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare timezone: string;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    declare AppSamlSecretId: number;

    @Column(DataType.UUID)
    declare AppMemberId?: string;

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

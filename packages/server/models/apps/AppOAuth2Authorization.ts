import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { type AppMember, type AppModels, type AppOAuth2Secret } from '../index.js';

export class AppOAuth2AuthorizationGlobal extends Model {
  /**
   * The subject id of the user on the remote authorization server.
   */
  declare sub: string;

  /**
   * The access token assigned to Appsemble linked to the subject.
   */
  declare accessToken: string;

  /**
   * The expiration date of the access token.
   */
  declare expiresAt?: Date;

  /**
   * The refresh token that may be used to refresh the access token.
   */
  declare refreshToken?: string;

  /**
   * The email used on the OAuth2 provider.
   */
  declare email: string;

  /**
   * Whether the linked email is verified on the OAuth2 provider.
   */
  declare emailVerified: boolean;

  declare created: Date;

  declare updated: Date;

  declare AppMemberId?: string;

  declare AppOAuth2SecretId: number;

  declare AppMember: Awaited<AppMember>;

  declare AppOAuth2Secret?: Awaited<AppOAuth2Secret>;
}

export function createAppOAuth2AuthorizationModel(
  sequelize: Sequelize,
): typeof AppOAuth2AuthorizationGlobal {
  @Table({ tableName: 'AppOAuth2Authorization' })
  class AppOAuth2Authorization extends AppOAuth2AuthorizationGlobal {
    @PrimaryKey
    @Column(DataType.STRING)
    declare sub: string;

    @AllowNull(false)
    @Column(DataType.TEXT)
    declare accessToken: string;

    @Column(DataType.DATE)
    declare expiresAt?: Date;

    @Column(DataType.TEXT)
    declare refreshToken?: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare email: string;

    @Default(false)
    @AllowNull(false)
    @Column(DataType.BOOLEAN)
    declare emailVerified: boolean;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;

    @Column(DataType.UUID)
    declare AppMemberId?: string;

    @PrimaryKey
    @Column(DataType.INTEGER)
    declare AppOAuth2SecretId: number;

    static associate(models: AppModels): void {
      AppOAuth2Authorization.belongsTo(models.AppMember, {
        foreignKey: 'AppMemberId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      AppOAuth2Authorization.belongsTo(models.AppOAuth2Secret, {
        foreignKey: 'AppOAuth2SecretId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  }

  sequelize.addModels([AppOAuth2Authorization]);
  return AppOAuth2Authorization;
}

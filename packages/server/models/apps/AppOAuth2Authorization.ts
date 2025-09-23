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
  sub!: string;

  /**
   * The access token assigned to Appsemble linked to the subject.
   */
  accessToken!: string;

  /**
   * The expiration date of the access token.
   */
  expiresAt?: Date;

  /**
   * The refresh token that may be used to refresh the access token.
   */
  refreshToken?: string;

  /**
   * The email used on the OAuth2 provider.
   */
  email!: string;

  /**
   * Whether the linked email is verified on the OAuth2 provider.
   */
  emailVerified!: boolean;

  created!: Date;

  updated!: Date;

  AppMemberId?: string;

  AppOAuth2SecretId!: number;

  AppMember!: Awaited<AppMember>;

  AppOAuth2Secret?: Awaited<AppOAuth2Secret>;
}

export function createAppOAuth2AuthorizationModel(
  sequelize: Sequelize,
): typeof AppOAuth2AuthorizationGlobal {
  @Table({ tableName: 'AppOAuth2Authorization' })
  class AppOAuth2Authorization extends AppOAuth2AuthorizationGlobal {
    @PrimaryKey
    @Column(DataType.STRING)
    sub!: string;

    @AllowNull(false)
    @Column(DataType.TEXT)
    accessToken!: string;

    @Column(DataType.DATE)
    expiresAt?: Date;

    @Column(DataType.TEXT)
    refreshToken?: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    email!: string;

    @Default(false)
    @AllowNull(false)
    @Column(DataType.BOOLEAN)
    emailVerified!: boolean;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;

    @Column(DataType.UUID)
    AppMemberId?: string;

    @PrimaryKey
    @Column(DataType.INTEGER)
    AppOAuth2SecretId!: number;

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

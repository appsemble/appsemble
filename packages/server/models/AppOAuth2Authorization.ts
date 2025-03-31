import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { AppMember, AppOAuth2Secret } from './index.js';

@Table({ tableName: 'AppOAuth2Authorization' })
export class AppOAuth2Authorization extends Model {
  /**
   * The subject id of the user on the remote authorization server.
   */
  @PrimaryKey
  @Column(DataType.STRING)
  sub!: string;

  @PrimaryKey
  @ForeignKey(() => AppOAuth2Secret)
  @Column(DataType.INTEGER)
  AppOAuth2SecretId!: number;

  @BelongsTo(() => AppOAuth2Secret, { onDelete: 'CASCADE' })
  AppOAuth2Secret?: Awaited<AppOAuth2Secret>;

  /**
   * The access token assigned to Appsemble linked to the subject.
   */
  @AllowNull(false)
  @Column(DataType.TEXT)
  accessToken!: string;

  /**
   * The expiration date of the access token.
   */
  @Column(DataType.DATE)
  expiresAt?: Date;

  /**
   * The refresh token that may be used to refresh the access token.
   */
  @Column(DataType.TEXT)
  refreshToken?: string;

  /**
   * The email used on the OAuth2 provider.
   */
  @AllowNull(false)
  @Column(DataType.STRING)
  email!: string;

  /**
   * Whether the linked email is verified on the OAuth2 provider.
   */
  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  emailVerified!: boolean;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;

  /**
   * The id of the linked app user.
   */
  @ForeignKey(() => AppMember)
  @Column(DataType.UUID)
  AppMemberId?: string;

  /**
   * The App user.
   */
  @BelongsTo(() => AppMember)
  AppMember!: Awaited<AppMember>;
}

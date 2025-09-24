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

import { User } from '../index.js';

@Table({ tableName: 'OAuthAuthorization' })
export class OAuthAuthorization extends Model {
  /**
   * The subject id of the user on the remote authorization server.
   */
  @PrimaryKey
  @Column(DataType.STRING)
  sub!: string;

  /**
   * The authorization URL where the user needs to approve Appsemble to access their account.
   */
  @PrimaryKey
  @Column(DataType.STRING)
  authorizationUrl!: string;

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
   * A short lived authorization code that’s used during the login process.
   */
  @Column(DataType.TEXT)
  code?: string;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;

  /**
   * The id of the linked Appsemble user.
   */
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId?: string;

  /**
   * The email used for the authorization
   */
  @Column(DataType.STRING)
  email?: string;

  /**
   * The Appsemble user.
   */
  @BelongsTo(() => User, { onDelete: 'SET NULL' })
  User?: Awaited<User>;
}

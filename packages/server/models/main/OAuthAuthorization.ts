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
  declare sub: string;

  /**
   * The authorization URL where the user needs to approve Appsemble to access their account.
   */
  @PrimaryKey
  @Column(DataType.STRING)
  declare authorizationUrl: string;

  /**
   * The access token assigned to Appsemble linked to the subject.
   */
  @AllowNull(false)
  @Column(DataType.TEXT)
  declare accessToken: string;

  /**
   * The expiration date of the access token.
   */
  @Column(DataType.DATE)
  declare expiresAt?: Date;

  /**
   * The refresh token that may be used to refresh the access token.
   */
  @Column(DataType.TEXT)
  declare refreshToken?: string;

  /**
   * A short lived authorization code that's used during the login process.
   */
  @Column(DataType.TEXT)
  declare code?: string;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;

  /**
   * The id of the linked Appsemble user.
   */
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare UserId?: string;

  /**
   * The email used for the authorization
   */
  @Column(DataType.STRING)
  declare email?: string;

  /**
   * The Appsemble user.
   */
  @BelongsTo(() => User, { onDelete: 'SET NULL' })
  declare User?: Awaited<User>;
}

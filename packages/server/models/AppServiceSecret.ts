import {
  AllowNull,
  AutoIncrement,
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

import { App } from './index.js';

@Table({ tableName: 'AppServiceSecret' })
export class AppServiceSecret extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column(DataType.STRING)
  name?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  urlPatterns!: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING })
  authenticationMethod!:
    | 'client-certificate'
    | 'client-credentials'
    | 'cookie'
    | 'custom-header'
    | 'http-basic'
    | 'query-parameter';

  @AllowNull(false)
  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  public: boolean;

  /**
   * Identifies the secret.
   *
   * Can be a certificate, cookie-, or client ID, username, or parameter/header name.
   */
  @Column({ type: DataType.TEXT })
  identifier?: string;

  /**
   * Can be a parameter-, header-, cookie, client secret, password, or private key.
   */
  @Column(DataType.BLOB)
  secret?: Buffer;

  /**
   * Used for the client-credentials flow.
   */
  @Column(DataType.STRING)
  tokenUrl?: string;

  /**
   * Used for the client-credentials flow.
   */
  @Column(DataType.STRING)
  scope?: string;

  /**
   * Used for the client-certificate flow.
   */
  @Column(DataType.TEXT)
  ca?: string;

  /**
   * The client-credentials access token used to authenticate outgoing requests.
   */
  @Column(DataType.BLOB)
  accessToken?: Buffer;

  /**
   * When the client-credentials `accessToken` expires.
   */
  @Column(DataType.DATE)
  expiresAt?: Date;

  @ForeignKey(() => App)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  AppId!: number;

  @BelongsTo(() => App)
  App?: Awaited<App>;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;
}

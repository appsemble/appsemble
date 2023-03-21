import {
  AllowNull,
  AutoIncrement,
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

import { App } from './index.js';

@Table({ tableName: 'AppServiceSecret' })
export class AppServiceSecret extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  serviceName: string;

  @AllowNull(false)
  @Column
  urlPatterns: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING })
  authenticationMethod:
    | 'client-certificate'
    | 'client-credentials'
    | 'cookie'
    | 'custom-header'
    | 'http-basic'
    | 'query-parameter';

  /**
   * Identifies the secret.
   *
   * Can be a certificate, cookie-, or client ID, username, or parameter/header name.
   */
  @Column({ type: DataType.TEXT })
  identifier: string;

  /**
   * Can be a parameter-, header-, cookie, client secret, password, or private key.
   */
  @Column
  secret: Buffer;

  /**
   * Used for the client-credentials flow.
   */
  @Column
  tokenUrl: string;

  /**
   * The client-credentials access token used to authenticate outgoing requests.
   */
  @Column
  accessToken: Buffer;

  /**
   * When the client-credentials `accessToken` expires.
   */
  @Column
  expiresAt: Date;

  @ForeignKey(() => App)
  @AllowNull(false)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}

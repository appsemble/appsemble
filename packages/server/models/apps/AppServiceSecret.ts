import {
  AllowNull,
  AutoIncrement,
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

export class AppServiceSecretGlobal extends Model {
  declare id: number;

  declare name?: string;

  declare urlPatterns: string;

  declare authenticationMethod:
    | 'client-certificate'
    | 'client-credentials'
    | 'cookie'
    | 'custom-header'
    | 'http-basic'
    | 'query-parameter';

  declare public: boolean;

  /**
   * Identifies the secret.
   *
   * Can be a certificate, cookie-, or client ID, username, or parameter/header name.
   */
  declare identifier?: string;

  /**
   * Can be a parameter-, header-, cookie, client secret, password, or private key.
   */
  declare secret?: Buffer;

  /**
   * Used for the client-credentials flow.
   */
  declare tokenUrl?: string;

  /**
   * Used for the client-credentials flow.
   */
  declare scope?: string;

  /**
   * Used for the client-certificate flow.
   */
  declare ca?: string;

  /**
   * The client-credentials access token used to authenticate outgoing requests.
   */
  declare accessToken?: Buffer;

  /**
   * When the client-credentials `accessToken` expires.
   */
  declare expiresAt?: Date;

  declare created: Date;

  declare updated: Date;
}

export function createAppServiceSecretModel(sequelize: Sequelize): typeof AppServiceSecretGlobal {
  @Table({ tableName: 'AppServiceSecret' })
  class AppServiceSecret extends AppServiceSecretGlobal {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id: number;

    @Column(DataType.STRING)
    declare name?: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare urlPatterns: string;

    @AllowNull(false)
    @Column({ type: DataType.STRING })
    declare authenticationMethod:
      | 'client-certificate'
      | 'client-credentials'
      | 'cookie'
      | 'custom-header'
      | 'http-basic'
      | 'query-parameter';

    @AllowNull(false)
    @Default(false)
    @Column({ type: DataType.BOOLEAN })
    declare public: boolean;

    @Column({ type: DataType.TEXT })
    declare identifier?: string;

    @Column(DataType.BLOB)
    declare secret?: Buffer;

    @Column(DataType.STRING)
    declare tokenUrl?: string;

    @Column(DataType.STRING)
    declare scope?: string;

    @Column(DataType.TEXT)
    declare ca?: string;

    @Column(DataType.BLOB)
    declare accessToken?: Buffer;

    @Column(DataType.DATE)
    declare expiresAt?: Date;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;
  }

  sequelize.addModels([AppServiceSecret]);
  return AppServiceSecret;
}

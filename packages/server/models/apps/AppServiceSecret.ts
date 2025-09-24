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
  id!: number;

  name?: string;

  urlPatterns!: string;

  authenticationMethod!:
    | 'client-certificate'
    | 'client-credentials'
    | 'cookie'
    | 'custom-header'
    | 'http-basic'
    | 'query-parameter';

  public!: boolean;

  /**
   * Identifies the secret.
   *
   * Can be a certificate, cookie-, or client ID, username, or parameter/header name.
   */
  identifier?: string;

  /**
   * Can be a parameter-, header-, cookie, client secret, password, or private key.
   */
  secret?: Buffer;

  /**
   * Used for the client-credentials flow.
   */
  tokenUrl?: string;

  /**
   * Used for the client-credentials flow.
   */
  scope?: string;

  /**
   * Used for the client-certificate flow.
   */
  ca?: string;

  /**
   * The client-credentials access token used to authenticate outgoing requests.
   */
  accessToken?: Buffer;

  /**
   * When the client-credentials `accessToken` expires.
   */
  expiresAt?: Date;

  created!: Date;

  updated!: Date;
}

export function createAppServiceSecretModel(sequelize: Sequelize): typeof AppServiceSecretGlobal {
  @Table({ tableName: 'AppServiceSecret' })
  class AppServiceSecret extends AppServiceSecretGlobal {
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
    public!: boolean;

    @Column({ type: DataType.TEXT })
    identifier?: string;

    @Column(DataType.BLOB)
    secret?: Buffer;

    @Column(DataType.STRING)
    tokenUrl?: string;

    @Column(DataType.STRING)
    scope?: string;

    @Column(DataType.TEXT)
    ca?: string;

    @Column(DataType.BLOB)
    accessToken?: Buffer;

    @Column(DataType.DATE)
    expiresAt?: Date;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;
  }

  sequelize.addModels([AppServiceSecret]);
  return AppServiceSecret;
}

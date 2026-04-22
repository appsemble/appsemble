import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Index,
  Model,
  PrimaryKey,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

export class AppMemberRefreshSessionGlobal extends Model {
  declare id: string;

  declare sub: string;

  declare aud: string;

  declare scope?: string;

  declare tokenHash: string;

  declare expires: Date;

  declare created: Date;

  declare updated: Date;
}

export function createAppMemberRefreshSessionModel(
  sequelize: Sequelize,
): typeof AppMemberRefreshSessionGlobal {
  @Table({ tableName: 'AppMemberRefreshSession' })
  class AppMemberRefreshSession extends AppMemberRefreshSessionGlobal {
    @PrimaryKey
    @AllowNull(false)
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    declare id: string;

    @AllowNull(false)
    @Index('app_member_refresh_session_sub')
    @Column(DataType.UUID)
    declare sub: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare aud: string;

    @Column(DataType.STRING)
    declare scope?: string;

    @AllowNull(false)
    @Index({ name: 'AppMemberRefreshSession_tokenHash_key', unique: true })
    @Column(DataType.STRING(64))
    declare tokenHash: string;

    @AllowNull(false)
    @Index('app_member_refresh_session_expires')
    @Column(DataType.DATE)
    declare expires: Date;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;
  }

  sequelize.addModels([AppMemberRefreshSession]);
  return AppMemberRefreshSession;
}

import { type AppRole } from '@appsemble/lang-sdk';
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

export class AppInviteGlobal extends Model {
  declare email: string;

  declare key: string;

  declare role: AppRole;

  declare userId?: string;

  declare created: Date;

  declare updated: Date;
}

export function createAppInviteModel(sequelize: Sequelize): typeof AppInviteGlobal {
  @Table({ tableName: 'AppInvite' })
  class AppInvite extends AppInviteGlobal {
    @PrimaryKey
    @AllowNull(false)
    @Column(DataType.STRING)
    declare email: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare key: string;

    @Default('Member')
    @AllowNull(false)
    @Column(DataType.STRING)
    declare role: AppRole;

    @Column(DataType.UUID)
    @Index({ name: 'AppInvite_UserId_key', unique: true })
    declare userId?: string;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;
  }

  sequelize.addModels([AppInvite]);
  return AppInvite;
}

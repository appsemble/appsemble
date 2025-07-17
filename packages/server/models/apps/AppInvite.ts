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
import { AppRole } from '@appsemble/lang-sdk';

export class AppInviteGlobal extends Model {
  email!: string;

  key!: string;

  role!: AppRole;

  userId?: string;

  created!: Date;

  updated!: Date;
}

export function createAppInviteModel(sequelize: Sequelize): typeof AppInviteGlobal {
  @Table({ tableName: 'AppInvite' })
  class AppInvite extends AppInviteGlobal {
    @PrimaryKey
    @AllowNull(false)
    @Column(DataType.STRING)
    email!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    key!: string;

    @Default('Member')
    @AllowNull(false)
    @Column(DataType.STRING)
    role!: AppRole;

    @Column(DataType.UUID)
    @Index({ name: 'AppInvite_UserId_key', unique: true })
    userId?: string;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;
  }

  sequelize.addModels([AppInvite]);
  return AppInvite;
}

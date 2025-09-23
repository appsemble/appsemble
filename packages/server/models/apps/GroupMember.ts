import { type AppRole } from '@appsemble/types';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  IsUUID,
  Model,
  PrimaryKey,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { type AppMember, type AppModels, type Group } from '../index.js';

export class GroupMemberGlobal extends Model {
  id!: string;

  role!: AppRole;

  created!: Date;

  updated!: Date;

  AppMemberId!: string;

  GroupId!: number;

  AppMember?: Awaited<AppMember>;

  Group?: Awaited<Group>;
}

export function createGroupMemberModel(sequelize: Sequelize): typeof GroupMemberGlobal {
  @Table({ tableName: 'GroupMember' })
  class GroupMember extends GroupMemberGlobal {
    @PrimaryKey
    @IsUUID(4)
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    role!: AppRole;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;

    @PrimaryKey
    @Column(DataType.UUID)
    AppMemberId!: string;

    @PrimaryKey
    @Column(DataType.INTEGER)
    GroupId!: number;

    static associate(models: AppModels): void {
      GroupMember.belongsTo(models.AppMember, {
        foreignKey: 'AppMemberId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      GroupMember.belongsTo(models.Group, {
        foreignKey: 'GroupId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  }

  sequelize.addModels([GroupMember]);
  return GroupMember;
}

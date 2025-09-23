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

import { type AppModels, type GroupInvite, type GroupMember } from '../index.js';

export class GroupGlobal extends Model {
  id!: number;

  name!: string;

  annotations?: Record<string, string>;

  demo!: boolean;

  created!: Date;

  updated!: Date;

  Members!: GroupMember[];

  Invites!: GroupInvite[];
}

export function createGroupModel(sequelize: Sequelize): typeof GroupGlobal {
  @Table({ tableName: 'Group' })
  class Group extends GroupGlobal {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number;

    @AllowNull(false)
    @Column(DataType.STRING)
    name!: string;

    @Column(DataType.JSON)
    annotations?: Record<string, string>;

    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    demo!: boolean;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;

    static associate(models: AppModels): void {
      Group.hasMany(models.GroupMember, { as: 'Members' });
      Group.hasMany(models.GroupInvite, { as: 'Invites' });
    }
  }

  sequelize.addModels([Group]);
  return Group;
}

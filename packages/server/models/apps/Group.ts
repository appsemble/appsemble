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
  declare id: number;

  declare name: string;

  declare annotations?: Record<string, string>;

  declare demo: boolean;

  declare created: Date;

  declare updated: Date;

  declare Members: GroupMember[];

  declare Invites: GroupInvite[];
}

export function createGroupModel(sequelize: Sequelize): typeof GroupGlobal {
  @Table({ tableName: 'Group' })
  class Group extends GroupGlobal {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id: number;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare name: string;

    @Column(DataType.JSON)
    declare annotations?: Record<string, string>;

    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    declare demo: boolean;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;

    static associate(models: AppModels): void {
      Group.hasMany(models.GroupMember, { as: 'Members' });
      Group.hasMany(models.GroupInvite, { as: 'Invites' });
    }
  }

  sequelize.addModels([Group]);
  return Group;
}
